"""Mirrors apps/api's careerFit.routes.ts."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.career_fit import CareerFitDto, GenerateCareerFitInput
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import career_fit_service

router = APIRouter(prefix="/career-fit", tags=["career-fit"])


@router.get("/", response_model=PaginatedResult[CareerFitDto])
async def list_career_fits_route(
    mongo_user_id: MongoUserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[CareerFitDto]:
    return await career_fit_service.list_career_fits(mongo_user_id, page, limit)


@router.post("/", response_model=CareerFitDto, status_code=201)
async def generate_career_fit_route(
    body: GenerateCareerFitInput, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> CareerFitDto:
    return await career_fit_service.generate_and_save(settings, db, mongo_user_id, body.targetRole)


@router.get("/{career_fit_id}", response_model=CareerFitDto)
async def get_career_fit_route(career_fit_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> CareerFitDto:
    return await career_fit_service.get_career_fit(career_fit_id, mongo_user_id)


@router.delete("/{career_fit_id}")
async def delete_career_fit_route(career_fit_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await career_fit_service.delete_career_fit(career_fit_id, mongo_user_id)
    return {"deleted": True}
