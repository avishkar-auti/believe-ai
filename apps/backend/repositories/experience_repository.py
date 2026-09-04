"""Beanie-backed access for Profile > Experience — mirrors
repositories/contact_repository.py's shape (every query takes user_id
explicitly; no ownership check happens anywhere else)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.experience import Experience


async def list_for_user(user_id: ObjectId) -> list[Experience]:
    return await Experience.find(Experience.userId == user_id).sort("order").to_list()


async def find_by_id(experience_id: ObjectId, user_id: ObjectId) -> Experience | None:
    return await Experience.find_one(Experience.id == experience_id, Experience.userId == user_id)


async def create(user_id: ObjectId, **fields: Any) -> Experience:
    order = await Experience.find(Experience.userId == user_id).count()
    doc = Experience(userId=user_id, order=order, **fields)
    await doc.insert()
    return doc


async def update(experience_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Experience | None:
    doc = await find_by_id(experience_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(experience_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(experience_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def reorder(user_id: ObjectId, ordered_ids: list[ObjectId]) -> list[Experience]:
    docs = await Experience.find(Experience.userId == user_id).to_list()
    by_id: dict[ObjectId, Experience] = {doc.id: doc for doc in docs if doc.id is not None}
    for index, doc_id in enumerate(ordered_ids):
        doc = by_id.get(doc_id)
        if doc:
            doc.order = index
            await doc.save()
    return await list_for_user(user_id)
