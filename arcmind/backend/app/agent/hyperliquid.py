import math
import time
import asyncio
from typing import Any

import httpx

from app.config import get_settings
from app.models import LeaderboardResponse, TraderMetrics
from app.services.apify_leaderboard import fetch_apify_leaderboard

HYPERLIQUID_URLS = {
    "mainnet": "https://api.hyperliquid.xyz",
    "testnet": "https://api.hyperliquid-testnet.xyz",
}


def _float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_metrics(
    account: str,
    name: str,
    pnl: float,
    roi: float,
    drawdown: float,
    win_rate: float,
    volume: float,
    volatility: float,
    consistency: float,
) -> TraderMetrics:
    sharpe = roi / max(volatility, 0.01)
    calmar = roi / max(drawdown, 0.01)
    degradation = max(0.0, min(1.0, (drawdown * 1.8) + max(0, 0.55 - win_rate) + max(0, volatility - 0.22)))
    return TraderMetrics(
        trader_id=account.replace(".", "").replace("0x", "hl-"),
        display_name=name,
        account=account,
        pnl_30d=round(pnl, 2),
        roi_30d=round(roi, 4),
        max_drawdown=round(drawdown, 4),
        win_rate=round(win_rate, 4),
        volume_30d=round(volume, 2),
        volatility=round(volatility, 4),
        consistency=round(consistency, 4),
        sharpe=round(sharpe, 3),
        calmar=round(calmar, 3),
        degradation=round(degradation, 3),
    )


async def fetch_leaderboard(limit: int = 24) -> list[TraderMetrics]:
    return (await fetch_leaderboard_feed(limit)).rows


async def fetch_leaderboard_feed(limit: int = 24) -> LeaderboardResponse:
    """Fetch Hyperliquid leaderboard-like data and normalize it for scoring."""
    network = get_settings().hyperliquid_data_network.lower()
    leader_addresses = get_settings().leader_address_list
    base_url = HYPERLIQUID_URLS.get(network, HYPERLIQUID_URLS["testnet"])
    if leader_addresses:
        rows = await _fetch_configured_leaders(base_url, leader_addresses, limit)
        return LeaderboardResponse(
            ok=bool(rows),
            source="hyperliquid-configured-wallets",
            network=network,
            message=f"Fetched {len(rows)} configured Hyperliquid leader wallets." if rows else "Configured leader wallets returned no usable fills.",
            rows=rows,
        )
    apify_feed = await fetch_apify_leaderboard()
    if apify_feed and apify_feed.ok and apify_feed.rows:
        return apify_feed
    return LeaderboardResponse(
        ok=False,
        source="hyperliquid-configured-wallets",
        network=network,
        message=(
            "No leader wallets configured. Hyperliquid's official /info API exposes user/account data, "
            "so ArcMind ranks real wallets from fills once HYPERLIQUID_LEADER_ADDRESSES is set."
        ),
        rows=[],
    )


async def _fetch_configured_leaders(base_url: str, addresses: list[str], limit: int) -> list[TraderMetrics]:
    start_time = int((time.time() - 30 * 24 * 60 * 60) * 1000)

    async def fetch_one(client: httpx.AsyncClient, index: int, address: str) -> TraderMetrics | None:
        try:
            fills_response = await client.post(
                f"{base_url}/info",
                json={"type": "userFillsByTime", "user": address, "startTime": start_time, "aggregateByTime": True},
            )
            fills_response.raise_for_status()
            fills = fills_response.json()
            if not isinstance(fills, list) or not fills:
                return None
            pnl = sum(_float(fill.get("closedPnl")) for fill in fills if isinstance(fill, dict))
            volume = sum(_float(fill.get("px")) * _float(fill.get("sz")) for fill in fills if isinstance(fill, dict))
            wins = sum(1 for fill in fills if isinstance(fill, dict) and _float(fill.get("closedPnl")) > 0)
            win_rate = wins / max(len(fills), 1)
            roi = max(-0.5, min(0.8, pnl / max(volume * 0.04, 1)))
            drawdown = min(0.35, max(0.02, abs(min(0, pnl)) / max(abs(pnl) + 1, 1) + (1 - win_rate) * 0.08))
            volatility = min(0.45, max(0.06, abs(roi) * 0.65 + (1 - win_rate) * 0.08))
            consistency = min(0.95, max(0.2, win_rate - drawdown + 0.25))
            return _build_metrics(address, f"Leader {index + 1}", pnl, roi, drawdown, win_rate, volume, volatility, consistency)
        except Exception:
            return None

    timeout = httpx.Timeout(8.0, connect=4.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        results = await asyncio.gather(
            *(fetch_one(client, index, address) for index, address in enumerate(addresses[:limit])),
            return_exceptions=False,
        )
    return [row for row in results if row is not None]


def _parse_hyperliquid(data: Any, limit: int) -> list[TraderMetrics]:
    if isinstance(data, dict):
        candidates = data.get("leaderboardRows") or data.get("rows") or data.get("accounts") or []
    elif isinstance(data, list):
        candidates = data
    else:
        candidates = []

    traders: list[TraderMetrics] = []
    for index, row in enumerate(candidates[:limit]):
        if not isinstance(row, dict):
            continue
        account = str(row.get("ethAddress") or row.get("account") or row.get("user") or f"0x{index:040x}")
        name = str(row.get("displayName") or row.get("name") or f"HL Trader {index + 1}")
        pnl = _float(row.get("pnl") or row.get("accountValueHistoryPnl") or row.get("totalPnl"))
        roi = _float(row.get("roi") or row.get("return") or row.get("pnlPercent"), 0.05)
        if roi > 2:
            roi /= 100
        volume = _float(row.get("volume") or row.get("notionalVolume") or row.get("totalVolume"), 1_000_000)
        win_rate = min(0.82, max(0.42, 0.52 + math.tanh(roi * 2) / 8))
        drawdown = min(0.35, max(0.025, abs(roi) * 0.35))
        volatility = min(0.45, max(0.07, abs(roi) * 0.6))
        consistency = min(0.95, max(0.35, win_rate - drawdown + 0.25))
        traders.append(_build_metrics(account, name, pnl, roi, drawdown, win_rate, volume, volatility, consistency))
    return traders
