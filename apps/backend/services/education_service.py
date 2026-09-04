"""Profile > Education — mirrors services/experience_service.py's shape."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.education import Education
from repositories import education_repository
from schemas.education import CreateEducationInput, EducationDto, UpdateEducationInput


def _to_dto(doc: Education) -> EducationDto:
    return EducationDto(
        id=str(doc.id),
        school=doc.school,
        degree=doc.degree,
        fieldOfStudy=doc.fieldOfStudy,
        startYear=doc.startYear,
        endYear=doc.endYear,
        grade=doc.grade,
        description=doc.description,
        order=doc.order,
    )


async def list_items(user_id: ObjectId) -> list[EducationDto]:
    docs = await education_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreateEducationInput) -> EducationDto:
    doc = await education_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(education_id: ObjectId, user_id: ObjectId, input_: UpdateEducationInput) -> EducationDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await education_repository.update(education_id, user_id, updates)
    if not doc:
        raise NotFoundError("Education not found")
    return _to_dto(doc)


async def delete(education_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await education_repository.delete(education_id, user_id)
    if not deleted:
        raise NotFoundError("Education not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[EducationDto]:
    docs = await education_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
