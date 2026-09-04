"""Profile > Experience — mirrors api/routes/contacts.py's route shapes."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.experience import CreateExperienceInput, ExperienceDto, UpdateExperienceInput
from schemas.profile_common import ReorderInput
from services import experience_service

router = APIRouter(prefix="/profile/experience", tags=["profile"])


@router.get("/", response_model=list[ExperienceDto])
async def list_experience_route(mongo_user_id: MongoUserIdDep) -> list[ExperienceDto]:
    return await experience_service.list_items(mongo_user_id)


@router.post("/", response_model=ExperienceDto, status_code=201)
async def create_experience_route(body: CreateExperienceInput, mongo_user_id: MongoUserIdDep) -> ExperienceDto:
    return await experience_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[ExperienceDto])
async def reorder_experience_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[ExperienceDto]:
    return await experience_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{experience_id}", response_model=ExperienceDto)
async def update_experience_route(
    experience_id: PydanticObjectId, body: UpdateExperienceInput, mongo_user_id: MongoUserIdDep
) -> ExperienceDto:
    return await experience_service.update(experience_id, mongo_user_id, body)


@router.delete("/{experience_id}")
async def delete_experience_route(experience_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await experience_service.delete(experience_id, mongo_user_id)
    return {"deleted": True}
