"""Profile > Skills — mirrors services/experience_service.py's shape, plus a
server-side cap of 5 "Top Skills" (featured=True) to back up the client-side
disabled-toggle-at-5 behavior."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError, ValidationError
from models.skill import Skill
from repositories import skill_repository
from schemas.skill import CreateSkillInput, SkillDto, UpdateSkillInput

MAX_FEATURED_SKILLS = 5


def _to_dto(doc: Skill) -> SkillDto:
    return SkillDto(id=str(doc.id), name=doc.name, category=doc.category, featured=doc.featured, order=doc.order)


async def list_items(user_id: ObjectId) -> list[SkillDto]:
    docs = await skill_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def _assert_featured_capacity(user_id: ObjectId, wants_featured: bool | None) -> None:
    if not wants_featured:
        return
    current = await skill_repository.count_featured(user_id)
    if current >= MAX_FEATURED_SKILLS:
        raise ValidationError(f"You can only feature up to {MAX_FEATURED_SKILLS} top skills.")


async def create(user_id: ObjectId, input_: CreateSkillInput) -> SkillDto:
    await _assert_featured_capacity(user_id, input_.featured)
    doc = await skill_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(skill_id: ObjectId, user_id: ObjectId, input_: UpdateSkillInput) -> SkillDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    if updates.get("featured"):
        existing = await skill_repository.find_by_id(skill_id, user_id)
        # Only a false->true transition consumes a capacity slot — re-saving
        # an already-featured skill (e.g. just renaming it) must not count
        # itself twice against the cap.
        if existing and not existing.featured:
            await _assert_featured_capacity(user_id, True)
    doc = await skill_repository.update(skill_id, user_id, updates)
    if not doc:
        raise NotFoundError("Skill not found")
    return _to_dto(doc)


async def delete(skill_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await skill_repository.delete(skill_id, user_id)
    if not deleted:
        raise NotFoundError("Skill not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[SkillDto]:
    docs = await skill_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
