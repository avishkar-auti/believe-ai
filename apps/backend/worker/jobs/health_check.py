"""One trivial job proving the arq pipeline end to end — enqueue, pick up,
execute, record a result — before any real BullMQ queue moves over."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from core.logging import get_logger

logger = get_logger(__name__)


async def health_check(ctx: dict[str, Any]) -> dict[str, Any]:
    ran_at = datetime.now(UTC).isoformat()
    logger.info("arq health_check job ran at %s", ran_at)
    return {"ok": True, "ranAt": ran_at}
