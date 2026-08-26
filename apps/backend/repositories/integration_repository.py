"""Beanie-backed integration access — mirrors apps/api's integration.repository.ts."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.integration import Integration, IntegrationProvider


async def list_for_user(user_id: ObjectId) -> list[Integration]:
    return await Integration.find(Integration.userId == user_id).to_list()


async def find_by_provider(user_id: ObjectId, provider: IntegrationProvider) -> Integration | None:
    return await Integration.find_one(Integration.userId == user_id, Integration.provider == provider)


async def upsert(user_id: ObjectId, provider: IntegrationProvider, email: str, encrypted_refresh_token: str) -> Integration:
    existing = await find_by_provider(user_id, provider)
    now = datetime.now(UTC)
    if existing:
        existing.email = email
        existing.encryptedRefreshToken = encrypted_refresh_token
        existing.connectedAt = now
        existing.updatedAt = now
        await existing.save()
        return existing

    doc = Integration(userId=user_id, provider=provider, email=email, encryptedRefreshToken=encrypted_refresh_token)
    await doc.insert()
    return doc


async def delete(user_id: ObjectId, provider: IntegrationProvider) -> bool:
    doc = await find_by_provider(user_id, provider)
    if not doc:
        return False
    await doc.delete()
    return True
