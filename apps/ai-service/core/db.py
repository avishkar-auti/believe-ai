"""MongoDB connection — reads the same database as apps/api and apps/worker.

This service is read-only against it: it has no write path anywhere, so it
can never drift from the Node app's Mongoose validation/business rules.
"""

from __future__ import annotations

from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.config import get_settings


@lru_cache
def _get_client() -> AsyncIOMotorClient:
    settings = get_settings()
    return AsyncIOMotorClient(settings.mongodb_uri)


def get_database() -> AsyncIOMotorDatabase:
    return _get_client().get_default_database()
