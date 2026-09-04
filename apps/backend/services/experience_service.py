"""Profile > Experience — mirrors services/contact_service.py's shape."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.experience import Experience
from repositories import experience_repository
from schemas.experience import CreateExperienceInput, ExperienceDto, UpdateExperienceInput


def _to_dto(doc: Experience) -> ExperienceDto:
    return ExperienceDto(
        id=str(doc.id),
        title=doc.title,
        company=doc.company,
        employmentType=doc.employmentType,
        location=doc.location,
        startDate=doc.startDate,
        endDate=doc.endDate,
        isCurrent=doc.isCurrent,
        description=doc.description,
        order=doc.order,
    )


async def list_items(user_id: ObjectId) -> list[ExperienceDto]:
    docs = await experience_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreateExperienceInput) -> ExperienceDto:
    doc = await experience_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(experience_id: ObjectId, user_id: ObjectId, input_: UpdateExperienceInput) -> ExperienceDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await experience_repository.update(experience_id, user_id, updates)
    if not doc:
        raise NotFoundError("Experience not found")
    return _to_dto(doc)


async def delete(experience_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await experience_repository.delete(experience_id, user_id)
    if not deleted:
        raise NotFoundError("Experience not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[ExperienceDto]:
    docs = await experience_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
