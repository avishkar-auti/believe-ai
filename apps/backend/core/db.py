"""MongoDB connection — reads the same database as apps/api and apps/worker.

Two client stacks, one database, never a parallel copy of the data:
- Motor (get_database()) backs the legacy read-only repositories/ access for
  capabilities not yet ported.
- pymongo's native async client (init_odm()) backs Beanie for the
  collections that have been migrated (see models/). Beanie 2.x dropped
  Motor entirely in favor of pymongo's own asynchronous API (added in
  pymongo 4.9+), so it needs pymongo.AsyncMongoClient specifically — a
  Motor database object is a different class and isn't what Beanie expects,
  not just a type-stub mismatch.
"""

from __future__ import annotations

from functools import lru_cache

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import AsyncMongoClient

from core.config import get_settings
from models import ALL_DOCUMENT_MODELS


@lru_cache
def _get_client() -> AsyncIOMotorClient:
    settings = get_settings()
    # tz_aware=True: without it the driver hands back naive datetimes for
    # every stored UTC instant, which silently corrupts them the moment
    # anything (an isoformat() call, a comparison against datetime.now(UTC))
    # treats the naive value as local time instead of UTC.
    return AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True)


def get_database() -> AsyncIOMotorDatabase:
    return _get_client().get_default_database()


@lru_cache
def _get_beanie_client() -> AsyncMongoClient:
    settings = get_settings()
    return AsyncMongoClient(settings.mongodb_uri, tz_aware=True)


async def init_odm() -> None:
    database = _get_beanie_client().get_default_database()
    await init_beanie(database=database, document_models=ALL_DOCUMENT_MODELS)
