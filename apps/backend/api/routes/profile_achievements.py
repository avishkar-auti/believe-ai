"""Profile > Achievements — mirrors api/routes/profile_experience.py's shape."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.achievement import AchievementDto, CreateAchievementInput, UpdateAchievementInput
from schemas.profile_common import ReorderInput
from services import achievement_service

router = APIRouter(prefix="/profile/achievements", tags=["profile"])


@router.get("/", response_model=list[AchievementDto])
async def list_achievements_route(mongo_user_id: MongoUserIdDep) -> list[AchievementDto]:
    return await achievement_service.list_items(mongo_user_id)


@router.post("/", response_model=AchievementDto, status_code=201)
async def create_achievement_route(body: CreateAchievementInput, mongo_user_id: MongoUserIdDep) -> AchievementDto:
    return await achievement_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[AchievementDto])
async def reorder_achievements_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[AchievementDto]:
    return await achievement_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{achievement_id}", response_model=AchievementDto)
async def update_achievement_route(
    achievement_id: PydanticObjectId, body: UpdateAchievementInput, mongo_user_id: MongoUserIdDep
) -> AchievementDto:
    return await achievement_service.update(achievement_id, mongo_user_id, body)


@router.delete("/{achievement_id}")
async def delete_achievement_route(achievement_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await achievement_service.delete(achievement_id, mongo_user_id)
    return {"deleted": True}
