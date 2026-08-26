"""Mirrors apps/api's auth.routes.ts."""

from __future__ import annotations

from fastapi import APIRouter

from agents.profile_summary_agent import generate_profile_summary
from api.dependencies import MongoUserIdDep, SettingsDep
from schemas.ai import ProfileSummaryRequest, ProfileSummaryResult
from schemas.user import UpdateProfileInput, UserDto, UsernameAvailableResult
from services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserDto)
async def get_me_route(mongo_user_id: MongoUserIdDep) -> UserDto:
    return await user_service.get_by_id(mongo_user_id)


@router.patch("/me", response_model=UserDto)
async def update_me_route(body: UpdateProfileInput, mongo_user_id: MongoUserIdDep) -> UserDto:
    return await user_service.update_profile(mongo_user_id, body)


@router.get("/me/username-available", response_model=UsernameAvailableResult)
async def username_available_route(u: str, mongo_user_id: MongoUserIdDep) -> UsernameAvailableResult:
    return UsernameAvailableResult(available=await user_service.check_username_available(mongo_user_id, u))


@router.post("/me/summary/generate", response_model=ProfileSummaryResult)
async def generate_profile_summary_route(
    body: ProfileSummaryRequest, settings: SettingsDep, _mongo_user_id: MongoUserIdDep
) -> ProfileSummaryResult:
    return await generate_profile_summary(settings, body)
