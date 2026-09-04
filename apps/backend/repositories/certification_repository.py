"""Beanie-backed access for Profile > Certifications — see
experience_repository.py for the pattern this mirrors exactly."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.certification import Certification


async def list_for_user(user_id: ObjectId) -> list[Certification]:
    return await Certification.find(Certification.userId == user_id).sort("order").to_list()


async def find_by_id(certification_id: ObjectId, user_id: ObjectId) -> Certification | None:
    return await Certification.find_one(Certification.id == certification_id, Certification.userId == user_id)


async def create(user_id: ObjectId, **fields: Any) -> Certification:
    order = await Certification.find(Certification.userId == user_id).count()
    doc = Certification(userId=user_id, order=order, **fields)
    await doc.insert()
    return doc


async def update(certification_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Certification | None:
    doc = await find_by_id(certification_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(certification_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(certification_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def reorder(user_id: ObjectId, ordered_ids: list[ObjectId]) -> list[Certification]:
    docs = await Certification.find(Certification.userId == user_id).to_list()
    by_id: dict[ObjectId, Certification] = {doc.id: doc for doc in docs if doc.id is not None}
    for index, doc_id in enumerate(ordered_ids):
        doc = by_id.get(doc_id)
        if doc:
            doc.order = index
            await doc.save()
    return await list_for_user(user_id)
