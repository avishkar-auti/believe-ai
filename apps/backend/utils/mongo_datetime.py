"""Motor/pymongo hand back naive datetimes representing UTC (Mongo itself
has no timezone concept — it stores UTC instants). Comparing or subtracting
one of those directly against an aware `datetime.now(UTC)` raises
`TypeError: can't compare offset-naive and offset-aware datetimes` — normalize
with this first."""

from __future__ import annotations

from datetime import UTC, datetime


def as_aware_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
