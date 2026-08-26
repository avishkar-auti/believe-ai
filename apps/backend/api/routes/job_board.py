"""Mirrors apps/api's job.routes.ts route shapes exactly. Named job_board
(not jobs) to avoid colliding with api/routes/jobs.py, which is the
existing /ai/jobs AI-drafting router — this one is the actual /jobs REST
resource. Browsing the board is open to every signed-in user; only
posting/managing needs recruiter mode (RecruiterUserIdDep)."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, RecruiterUserIdDep, SettingsDep, UserIdDep
from models.job import EmploymentType, ExperienceLevel, WorkMode
from schemas.job import (
    CreateJobInput,
    DatePostedFilter,
    JobDto,
    JobFilterOptions,
    JobSource,
    ToggleSaveInput,
    ToggleSaveResult,
    UpdateJobInput,
)
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import audit_service, job_service
from services.job_service import JobSearchFilters

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", response_model=PaginatedResult[JobDto])
async def search_jobs_route(
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
    settings: SettingsDep,
    q: str | None = None,
    country: str | None = None,
    state: str | None = None,
    city: str | None = None,
    company: str | None = None,
    employmentType: EmploymentType | None = None,
    workMode: WorkMode | None = None,
    experienceLevel: ExperienceLevel | None = None,
    skill: str | None = None,
    source: JobSource | None = None,
    salaryMin: float | None = None,
    datePosted: DatePostedFilter | None = None,
    savedOnly: bool = False,
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
) -> PaginatedResult[JobDto]:
    filters = JobSearchFilters(
        q=q,
        country=country,
        state=state,
        city=city,
        company=company,
        employmentType=employmentType,
        workMode=workMode,
        experienceLevel=experienceLevel,
        skill=skill,
        source=source,
        salaryMin=salaryMin,
        datePosted=datePosted,
        savedOnly=savedOnly,
    )
    return await job_service.search(settings, filters, page, limit, mongo_user_id)


@router.get("/filters", response_model=JobFilterOptions)
async def job_filters_route(_user_id: UserIdDep) -> JobFilterOptions:
    return await job_service.get_filter_options()


@router.get("/mine", response_model=list[JobDto])
async def list_my_jobs_route(recruiter_user_id: RecruiterUserIdDep) -> list[JobDto]:
    return await job_service.list_mine(recruiter_user_id)


@router.post("/{job_id}/save", response_model=ToggleSaveResult)
async def toggle_save_job_route(job_id: str, body: ToggleSaveInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> ToggleSaveResult:
    saved = await job_service.toggle_save(mongo_user_id, job_id, body.job)
    return ToggleSaveResult(saved=saved)


@router.get("/{job_id}", response_model=JobDto)
async def get_job_route(job_id: PydanticObjectId, _user_id: UserIdDep) -> JobDto:
    return await job_service.get_by_id(job_id)


@router.post("/", response_model=JobDto, status_code=201)
async def create_job_route(body: CreateJobInput, recruiter_user_id: RecruiterUserIdDep) -> JobDto:
    job = await job_service.create(recruiter_user_id, body)
    await audit_service.record(recruiter_user_id, "job.created", "job", entity_id=job.id)
    return job


@router.patch("/{job_id}", response_model=JobDto)
async def update_job_route(job_id: PydanticObjectId, body: UpdateJobInput, recruiter_user_id: RecruiterUserIdDep) -> JobDto:
    job = await job_service.update(job_id, recruiter_user_id, body)
    await audit_service.record(recruiter_user_id, "job.updated", "job", entity_id=job.id)
    return job


@router.delete("/{job_id}")
async def delete_job_route(job_id: PydanticObjectId, recruiter_user_id: RecruiterUserIdDep) -> dict[str, Literal[True]]:
    await job_service.delete(job_id, recruiter_user_id)
    await audit_service.record(recruiter_user_id, "job.deleted", "job", entity_id=str(job_id))
    return {"deleted": True}
