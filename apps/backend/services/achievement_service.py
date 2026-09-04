"""Profile > Achievements — mirrors services/experience_service.py's shape."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.achievement import Achievement
from repositories import achievement_repository
from schemas.achievement import AchievementDto, CreateAchievementInput, UpdateAchievementInput


def _to_dto(doc: Achievement) -> AchievementDto:
    return AchievementDto(
        id=str(doc.id), title=doc.title, category=doc.category, description=doc.description, date=doc.date, order=doc.order
    )


async def list_items(user_id: ObjectId) -> list[AchievementDto]:
    docs = await achievement_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreateAchievementInput) -> AchievementDto:
    doc = await achievement_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(achievement_id: ObjectId, user_id: ObjectId, input_: UpdateAchievementInput) -> AchievementDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await achievement_repository.update(achievement_id, user_id, updates)
    if not doc:
        raise NotFoundError("Achievement not found")
    return _to_dto(doc)


async def delete(achievement_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await achievement_repository.delete(achievement_id, user_id)
    if not deleted:
        raise NotFoundError("Achievement not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[AchievementDto]:
    docs = await achievement_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
