"""Beanie-backed access for Profile > Achievements — see
experience_repository.py for the pattern this mirrors exactly."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.achievement import Achievement


async def list_for_user(user_id: ObjectId) -> list[Achievement]:
    return await Achievement.find(Achievement.userId == user_id).sort("order").to_list()


async def find_by_id(achievement_id: ObjectId, user_id: ObjectId) -> Achievement | None:
    return await Achievement.find_one(Achievement.id == achievement_id, Achievement.userId == user_id)


async def create(user_id: ObjectId, **fields: Any) -> Achievement:
    order = await Achievement.find(Achievement.userId == user_id).count()
    doc = Achievement(userId=user_id, order=order, **fields)
    await doc.insert()
    return doc


async def update(achievement_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Achievement | None:
    doc = await find_by_id(achievement_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(achievement_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(achievement_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def reorder(user_id: ObjectId, ordered_ids: list[ObjectId]) -> list[Achievement]:
    docs = await Achievement.find(Achievement.userId == user_id).to_list()
    by_id: dict[ObjectId, Achievement] = {doc.id: doc for doc in docs if doc.id is not None}
    for index, doc_id in enumerate(ordered_ids):
        doc = by_id.get(doc_id)
        if doc:
            doc.order = index
            await doc.save()
    return await list_for_user(user_id)
