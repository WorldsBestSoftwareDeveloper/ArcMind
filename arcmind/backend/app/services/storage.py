import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from app.config import get_settings
from app.models import AgentDecision, AppMetrics, FollowerProfile, TraderMetrics


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Storage:
    def __init__(self) -> None:
        self.path = Path(get_settings().database_path)
        self.init()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def init(self) -> None:
        with self.connect() as db:
            db.executescript(
                """
                create table if not exists followers (
                    wallet text primary key,
                    risk_profile text not null,
                    target_deploy_bps integer not null,
                    max_leader_bps integer not null,
                    active integer not null default 1,
                    created_at text not null,
                    updated_at text not null
                );

                create table if not exists leader_snapshots (
                    trader_id text primary key,
                    payload text not null,
                    score real not null,
                    captured_at text not null
                );

                create table if not exists agent_decisions (
                    id integer primary key autoincrement,
                    wallet text,
                    risk_profile text not null,
                    decision_hash text not null,
                    payload text not null,
                    created_at text not null
                );

                create table if not exists app_settings (
                    key text primary key,
                    value text not null,
                    updated_at text not null
                );
                """
            )

    def upsert_follower(self, wallet: str, risk_profile: str) -> FollowerProfile:
        now = utcnow().isoformat()
        target_deploy_bps = {"conservative": 6_000, "moderate": 8_000, "aggressive": 9_500}[risk_profile]
        max_leader_bps = {"conservative": 2_500, "moderate": 3_500, "aggressive": 5_000}[risk_profile]
        with self.connect() as db:
            existing = db.execute("select created_at from followers where wallet = ?", (wallet.lower(),)).fetchone()
            db.execute(
                """
                insert into followers (wallet, risk_profile, target_deploy_bps, max_leader_bps, active, created_at, updated_at)
                values (?, ?, ?, ?, 1, ?, ?)
                on conflict(wallet) do update set
                    risk_profile = excluded.risk_profile,
                    target_deploy_bps = excluded.target_deploy_bps,
                    max_leader_bps = excluded.max_leader_bps,
                    active = 1,
                    updated_at = excluded.updated_at
                """,
                (wallet.lower(), risk_profile, target_deploy_bps, max_leader_bps, existing["created_at"] if existing else now, now),
            )
        return FollowerProfile(
            wallet=wallet.lower(),
            risk_profile=risk_profile,
            target_deploy_bps=target_deploy_bps,
            max_leader_bps=max_leader_bps,
            active=True,
            created_at=datetime.fromisoformat(existing["created_at"]) if existing else datetime.fromisoformat(now),
            updated_at=datetime.fromisoformat(now),
        )

    def store_leaders(self, leaders: list[TraderMetrics], scores: dict[str, float]) -> None:
        now = utcnow().isoformat()
        with self.connect() as db:
            for leader in leaders:
                db.execute(
                    """
                    insert into leader_snapshots (trader_id, payload, score, captured_at)
                    values (?, ?, ?, ?)
                    on conflict(trader_id) do update set payload = excluded.payload, score = excluded.score, captured_at = excluded.captured_at
                    """,
                    (leader.trader_id, leader.model_dump_json(), scores.get(leader.trader_id, 0.0), now),
                )

    def latest_leaders(self, limit: int = 12) -> list[TraderMetrics]:
        with self.connect() as db:
            rows = db.execute(
                """
                select payload
                from leader_snapshots
                order by score desc, captured_at desc
                limit ?
                """,
                (limit,),
            ).fetchall()
        leaders: list[TraderMetrics] = []
        for row in rows:
            try:
                leaders.append(TraderMetrics.model_validate(json.loads(row["payload"])))
            except Exception:
                continue
        return leaders

    def store_decision(self, decision: AgentDecision) -> None:
        with self.connect() as db:
            db.execute(
                """
                insert into agent_decisions (wallet, risk_profile, decision_hash, payload, created_at)
                values (?, ?, ?, ?, ?)
                """,
                (
                    decision.follower_wallet.lower() if decision.follower_wallet else None,
                    decision.risk_profile,
                    decision.decision_hash,
                    decision.model_dump_json(),
                    utcnow().isoformat(),
                ),
            )

    def latest_decision(self, wallet: str | None = None, risk_profile: str | None = "moderate") -> AgentDecision | None:
        with self.connect() as db:
            if wallet:
                row = db.execute("select payload from agent_decisions where wallet = ? order by id desc limit 1", (wallet.lower(),)).fetchone()
            elif risk_profile is None:
                row = db.execute("select payload from agent_decisions order by id desc limit 1").fetchone()
            else:
                row = db.execute("select payload from agent_decisions where risk_profile = ? order by id desc limit 1", (risk_profile,)).fetchone()
            if not row:
                return None
            return AgentDecision.model_validate(json.loads(row["payload"]))

    def metrics(self, chain_tvl: float, latest_hash: str | None) -> AppMetrics:
        with self.connect() as db:
            followers = db.execute("select count(*) as c from followers where active = 1").fetchone()["c"]
            leaders = db.execute("select count(*) as c from leader_snapshots").fetchone()["c"]
        return AppMetrics(
            total_tvl=chain_tvl,
            active_followers=followers,
            tracked_leaders=leaders,
            latest_decision_hash=latest_hash,
        )

    def recent_decision_activity(self, limit: int = 4) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                """
                select wallet, risk_profile, decision_hash, payload, created_at
                from agent_decisions
                order by id desc
                limit ?
                """,
                (limit,),
            ).fetchall()
        activity = []
        for row in rows:
            payload = json.loads(row["payload"])
            allocations = payload.get("allocations", [])
            exits = payload.get("exits", [])
            total_bps = sum(item.get("weight_bps", 0) for item in allocations)
            activity.append(
                {
                    "type": "agent_decision",
                    "title": "AI rebalance decision generated",
                    "detail": (
                        f"{row['risk_profile']} profile - {len(allocations)} leaders, "
                        f"{total_bps / 100:.1f}% deployed, {len(exits)} exits - {row['decision_hash'][:10]}..."
                    ),
                    "wallet": row["wallet"],
                    "timestamp": row["created_at"],
                }
            )
        return activity

    def set_setting(self, key: str, value: str) -> None:
        with self.connect() as db:
            db.execute(
                """
                insert into app_settings (key, value, updated_at)
                values (?, ?, ?)
                on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at
                """,
                (key, value, utcnow().isoformat()),
            )

    def get_setting(self, key: str, default: str) -> str:
        with self.connect() as db:
            row = db.execute("select value from app_settings where key = ?", (key,)).fetchone()
        return row["value"] if row else default

    def set_agent_paused(self, paused: bool) -> None:
        self.set_setting("agent_paused", "true" if paused else "false")

    def is_agent_paused(self) -> bool:
        return self.get_setting("agent_paused", "false") == "true"


storage = Storage()
