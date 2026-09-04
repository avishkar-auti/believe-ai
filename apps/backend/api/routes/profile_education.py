"""Profile > Education — mirrors api/routes/profile_experience.py's shape."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.education import CreateEducationInput, EducationDto, UpdateEducationInput
from schemas.profile_common import ReorderInput
from services import education_service

router = APIRouter(prefix="/profile/education", tags=["profile"])


@router.get("/", response_model=list[EducationDto])
async def list_education_route(mongo_user_id: MongoUserIdDep) -> list[EducationDto]:
    return await education_service.list_items(mongo_user_id)


@router.post("/", response_model=EducationDto, status_code=201)
async def create_education_route(body: CreateEducationInput, mongo_user_id: MongoUserIdDep) -> EducationDto:
    return await education_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[EducationDto])
async def reorder_education_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[EducationDto]:
    return await education_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{education_id}", response_model=EducationDto)
async def update_education_route(
    education_id: PydanticObjectId, body: UpdateEducationInput, mongo_user_id: MongoUserIdDep
) -> EducationDto:
    return await education_service.update(education_id, mongo_user_id, body)


@router.delete("/{education_id}")
async def delete_education_route(education_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await education_service.delete(education_id, mongo_user_id)
    return {"deleted": True}
