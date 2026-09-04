"""Simple Redis-backed fixed-window rate limiter — reuses the same Redis
instance the arq worker queue already depends on (core/config.py's
redis_url) rather than introducing new infrastructure. Not general-purpose
middleware; called explicitly at the one call site that currently needs it
(AI Practice Lab's Run/Evaluate/Submit, see services/submission_service.py),
since real sandbox execution is a real, finite, spendable resource."""

from __future__ import annotations

from functools import lru_cache

from redis.asyncio import Redis

from core.config import get_settings
from core.errors import PlanLimitExceededError


@lru_cache
def _get_redis() -> Redis:
    return Redis.from_url(get_settings().redis_url)


async def enforce_rate_limit(scope: str, key: str, limit: int, window_seconds: int) -> None:
    """Raises PlanLimitExceededError once `key` has used `scope` more than
    `limit` times within the trailing `window_seconds`. A fixed window
    (one INCR, EXPIRE only on the first hit) rather than a sliding one —
    simpler, and good enough for protecting a single low-throughput sandbox
    worker rather than a precise public API quota."""
    redis_key = f"ratelimit:{scope}:{key}"
    client = _get_redis()
    count = await client.incr(redis_key)
    if count == 1:
        await client.expire(redis_key, window_seconds)

    if count > limit:
        ttl = await client.ttl(redis_key)
        retry_note = f" Try again in about {max(1, ttl // 60)} minute{'s' if ttl >= 120 else ''}." if ttl > 0 else ""
        raise PlanLimitExceededError(f"You've hit the {scope.replace('_', ' ')} limit ({limit} per hour).{retry_note}")
