"""Shared arq Redis connection — one enqueue function per job as each BullMQ
queue gets ported (Phase 4+); worker/settings.py's WorkerSettings is what
actually executes them, sharing this same Redis instance/settings."""

from __future__ import annotations

from functools import lru_cache

from arq import ArqRedis, create_pool
from arq.connections import RedisSettings

from core.config import get_settings


@lru_cache
def get_redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(get_settings().redis_url)


async def get_worker_pool() -> ArqRedis:
    return await create_pool(get_redis_settings())
