"""Beanie-backed access for Profile > Skills — see
experience_repository.py for the pattern this mirrors exactly."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from models.skill import Skill


async def list_for_user(user_id: ObjectId) -> list[Skill]:
    return await Skill.find(Skill.userId == user_id).sort("order").to_list()


async def find_by_id(skill_id: ObjectId, user_id: ObjectId) -> Skill | None:
    return await Skill.find_one(Skill.id == skill_id, Skill.userId == user_id)


async def count_featured(user_id: ObjectId) -> int:
    return await Skill.find(Skill.userId == user_id, Skill.featured == True).count()  # noqa: E712


async def create(user_id: ObjectId, **fields: Any) -> Skill:
    order = await Skill.find(Skill.userId == user_id).count()
    doc = Skill(userId=user_id, order=order, **fields)
    await doc.insert()
    return doc


async def update(skill_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Skill | None:
    doc = await find_by_id(skill_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    await doc.save()
    return doc


async def delete(skill_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(skill_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def reorder(user_id: ObjectId, ordered_ids: list[ObjectId]) -> list[Skill]:
    docs = await Skill.find(Skill.userId == user_id).to_list()
    by_id: dict[ObjectId, Skill] = {doc.id: doc for doc in docs if doc.id is not None}
    for index, doc_id in enumerate(ordered_ids):
        doc = by_id.get(doc_id)
        if doc:
            doc.order = index
            await doc.save()
    return await list_for_user(user_id)
