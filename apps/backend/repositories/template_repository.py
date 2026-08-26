"""Beanie-backed template access — mirrors apps/api's template.repository.ts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.template import Template


async def list_for_user(user_id: ObjectId) -> list[Template]:
    return await Template.find(Template.userId == user_id).sort("-createdAt").to_list()


async def find_by_id(template_id: ObjectId, user_id: ObjectId) -> Template | None:
    return await Template.find_one(Template.id == template_id, Template.userId == user_id)


async def create(user_id: ObjectId, *, name: str, subject: str, body: str) -> Template:
    doc = Template(userId=user_id, name=name, subject=subject, body=body)
    await doc.insert()
    return doc


async def update(template_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Template | None:
    doc = await find_by_id(template_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(template_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(template_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
