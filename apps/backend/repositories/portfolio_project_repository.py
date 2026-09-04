"""Beanie-backed access for Profile > Projects — see
experience_repository.py for the pattern this mirrors exactly."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.portfolio_project import PortfolioProject


async def list_for_user(user_id: ObjectId) -> list[PortfolioProject]:
    return await PortfolioProject.find(PortfolioProject.userId == user_id).sort("order").to_list()


async def find_by_id(project_id: ObjectId, user_id: ObjectId) -> PortfolioProject | None:
    return await PortfolioProject.find_one(PortfolioProject.id == project_id, PortfolioProject.userId == user_id)


async def create(user_id: ObjectId, **fields: Any) -> PortfolioProject:
    order = await PortfolioProject.find(PortfolioProject.userId == user_id).count()
    doc = PortfolioProject(userId=user_id, order=order, **fields)
    await doc.insert()
    return doc


async def update(project_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> PortfolioProject | None:
    doc = await find_by_id(project_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(project_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(project_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def reorder(user_id: ObjectId, ordered_ids: list[ObjectId]) -> list[PortfolioProject]:
    docs = await PortfolioProject.find(PortfolioProject.userId == user_id).to_list()
    by_id: dict[ObjectId, PortfolioProject] = {doc.id: doc for doc in docs if doc.id is not None}
    for index, doc_id in enumerate(ordered_ids):
        doc = by_id.get(doc_id)
        if doc:
            doc.order = index
            await doc.save()
    return await list_for_user(user_id)
