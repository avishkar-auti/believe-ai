"""Mirrors apps/api's jobIntel.routes.ts route shapes exactly."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, SettingsDep, UserIdDep
from schemas.job_intel import AnalyzeJobUrlInput, JobIntelDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import audit_service, job_intel_service

router = APIRouter(prefix="/job-intel", tags=["job-intel"])


@router.get("/", response_model=PaginatedResult[JobIntelDto])
async def list_job_intel_route(
    mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[JobIntelDto]:
    return await job_intel_service.list_job_intel(mongo_user_id, page, limit)


@router.post("/", response_model=JobIntelDto, status_code=201)
async def analyze_job_url_route(
    body: AnalyzeJobUrlInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep
) -> JobIntelDto:
    result = await job_intel_service.analyze(settings, mongo_user_id, body.jobUrl.strip())
    await audit_service.record(mongo_user_id, "job_intel.analyzed", "job_intel", entity_id=result.id)
    return result


@router.get("/{job_intel_id}", response_model=JobIntelDto)
async def get_job_intel_route(job_intel_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> JobIntelDto:
    return await job_intel_service.get_by_id(job_intel_id, mongo_user_id)


@router.delete("/{job_intel_id}")
async def delete_job_intel_route(
    job_intel_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, Literal[True]]:
    await job_intel_service.delete(job_intel_id, mongo_user_id)
    return {"deleted": True}
