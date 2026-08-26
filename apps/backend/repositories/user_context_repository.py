"""Beanie-backed Believe Profile access — one document per user, upserted
on every update since a profile is optional and created lazily."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.user_context import UserContext
from schemas.user_context import UpdateUserContextInput


async def find_by_user_id(user_id: ObjectId) -> UserContext | None:
    return await UserContext.find_one(UserContext.userId == user_id)


async def upsert(user_id: ObjectId, updates: UpdateUserContextInput) -> UserContext:
    existing = await UserContext.find_one(UserContext.userId == user_id)
    fields = updates.model_dump(exclude_unset=True)
    if existing:
        for key, value in fields.items():
            setattr(existing, key, value)
        existing.updatedAt = datetime.now(UTC)
        await existing.save()
        return existing

    doc = UserContext(userId=user_id, **fields)
    await doc.insert()
    return doc
