"""Profile > Skills — mirrors api/routes/profile_experience.py's shape."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.profile_common import ReorderInput
from schemas.skill import CreateSkillInput, SkillDto, UpdateSkillInput
from services import skill_service

router = APIRouter(prefix="/profile/skills", tags=["profile"])


@router.get("/", response_model=list[SkillDto])
async def list_skills_route(mongo_user_id: MongoUserIdDep) -> list[SkillDto]:
    return await skill_service.list_items(mongo_user_id)


@router.post("/", response_model=SkillDto, status_code=201)
async def create_skill_route(body: CreateSkillInput, mongo_user_id: MongoUserIdDep) -> SkillDto:
    return await skill_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[SkillDto])
async def reorder_skills_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[SkillDto]:
    return await skill_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{skill_id}", response_model=SkillDto)
async def update_skill_route(skill_id: PydanticObjectId, body: UpdateSkillInput, mongo_user_id: MongoUserIdDep) -> SkillDto:
    return await skill_service.update(skill_id, mongo_user_id, body)


@router.delete("/{skill_id}")
async def delete_skill_route(skill_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await skill_service.delete(skill_id, mongo_user_id)
    return {"deleted": True}
