from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings
from app.models import LeaderboardResponse, TraderMetrics

_cache: tuple[datetime, LeaderboardResponse] | None = None


def _float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _get_nested(row: dict, *keys: str) -> Any:
    value: Any = row
    for key in keys:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def _performance_value(row: dict, metric: str) -> float:
    windows = row.get("windowPerformances") or row.get("performances") or {}
    if isinstance(windows, dict):
        for window_key in ("month", "30d", "thirtyDays", "allTime"):
            window = windows.get(window_key)
            if isinstance(window, dict) and metric in window:
                return _float(window.get(metric))
    if isinstance(windows, list):
        preferred = ("month", "30d", "thirtyDays", "week", "allTime", "day")
        by_window: dict[str, dict] = {}
        for item in windows:
            if isinstance(item, list) and len(item) >= 2 and isinstance(item[1], dict):
                by_window[str(item[0])] = item[1]
            elif isinstance(item, tuple) and len(item) >= 2 and isinstance(item[1], dict):
                by_window[str(item[0])] = item[1]
        for window_key in preferred:
            window = by_window.get(window_key)
            if isinstance(window, dict) and metric in window:
                return _float(window.get(metric))
    return _float(row.get(metric))


def _normalize_row(row: dict, index: int) -> TraderMetrics | None:
    address = row.get("ethAddress") or row.get("address") or row.get("user") or row.get("wallet")
    if not address:
        return None
    name = row.get("displayName") or row.get("name") or row.get("username") or f"HL Leader {index + 1}"
    pnl = _performance_value(row, "pnl")
    roi = _performance_value(row, "roi")
    if roi > 2:
        roi = roi / 100
    volume = _performance_value(row, "vlm") or _performance_value(row, "volume") or _float(row.get("volume"))
    account_value = _float(row.get("accountValue") or row.get("equity") or _get_nested(row, "account", "value"))
    max_drawdown = abs(_performance_value(row, "maxDrawdown") or _float(row.get("maxDrawdown"), 0.08))
    if max_drawdown > 1:
        max_drawdown = max_drawdown / 100
    win_rate = max(0.42, min(0.78, 0.54 + max(min(roi, 0.5), -0.3) / 5))
    volatility = min(0.45, max(0.06, abs(roi) * 0.6 + max_drawdown * 0.55))
    consistency = min(0.95, max(0.25, win_rate - max_drawdown + 0.24))
    sharpe = roi / max(volatility, 0.01)
    calmar = roi / max(max_drawdown, 0.01)
    degradation = max(0.0, min(1.0, (max_drawdown * 1.8) + max(0, 0.55 - win_rate) + max(0, volatility - 0.22)))
    trader_id = str(address).lower().replace("0x", "hl-")
    return TraderMetrics(
        trader_id=trader_id,
        display_name=str(name),
        account=str(address),
        pnl_30d=round(pnl, 2),
        roi_30d=round(roi, 4),
        max_drawdown=round(max_drawdown, 4),
        win_rate=round(win_rate, 4),
        volume_30d=round(volume or account_value, 2),
        volatility=round(volatility, 4),
        consistency=round(consistency, 4),
        sharpe=round(sharpe, 3),
        calmar=round(calmar, 3),
        degradation=round(degradation, 3),
    )


async def fetch_apify_leaderboard(force: bool = False) -> LeaderboardResponse | None:
    global _cache
    settings = get_settings()
    if not settings.apify_token:
        return None
    now = datetime.now(timezone.utc)
    if not force and _cache and now - _cache[0] < timedelta(seconds=settings.apify_cache_ttl_seconds):
        return _cache[1]

    actor_input = {
        "limit": settings.apify_leaderboard_limit,
    }
    actor_id = settings.apify_actor_id.replace("/", "~")
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            run_response = await client.post(
                f"https://api.apify.com/v2/acts/{actor_id}/runs?token={settings.apify_token}&waitForFinish=120",
                json=actor_input,
            )
            if run_response.status_code == 402:
                return LeaderboardResponse(
                    ok=False,
                    source="apify-hyperliquid",
                    network=settings.hyperliquid_data_network,
                    message="Apify returned 402 Payment Required. Add Apify credits or use configured leader wallets.",
                    rows=[],
                )
            run_response.raise_for_status()
            run = run_response.json()["data"]
            dataset_id = run["defaultDatasetId"]
            items_response = await client.get(
                f"https://api.apify.com/v2/datasets/{dataset_id}/items?clean=true&limit={settings.apify_leaderboard_limit}&token={settings.apify_token}"
            )
            items_response.raise_for_status()
            items = items_response.json()
    except httpx.HTTPError as exc:
        return LeaderboardResponse(
            ok=False,
            source="apify-hyperliquid",
            network=settings.hyperliquid_data_network,
            message=f"Apify leaderboard fetch failed: {exc}",
            rows=[],
        )
    rows = [
        metric
        for index, item in enumerate(items[: settings.apify_leaderboard_limit])
        if isinstance(item, dict)
        for metric in [_normalize_row(item, index)]
        if metric is not None
    ]
    response = LeaderboardResponse(
        ok=bool(rows),
        source="apify-hyperliquid",
        network=settings.hyperliquid_data_network,
        message=f"Fetched {len(rows)} Hyperliquid leaders from Apify." if rows else "Apify returned no usable leader rows.",
        rows=rows,
    )
    _cache = (now, response)
    return response
