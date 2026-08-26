"""Mirrors packages/shared's isRoomJoinable — join window: opens 10 minutes
early, closes 30 minutes after the scheduled end. Shared by the REST check
(when that's ported) and the WS gate."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from utils.mongo_datetime import as_aware_utc


def is_room_joinable(scheduled_at: datetime, duration_minutes: int, now: datetime | None = None) -> bool:
    scheduled_at = as_aware_utc(scheduled_at)
    current = now or datetime.now(UTC)
    opens_at = scheduled_at - timedelta(minutes=10)
    closes_at = scheduled_at + timedelta(minutes=duration_minutes) + timedelta(minutes=30)
    return opens_at <= current <= closes_at
