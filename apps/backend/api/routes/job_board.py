"""Mirrors apps/api's job.routes.ts route shapes exactly. Named job_board
(not jobs) to avoid colliding with api/routes/jobs.py, which is the
existing /ai/jobs AI-drafting router — this one is the actual /jobs REST
resource. Browsing, saving, and matching are open to every signed-in user —
there is no recruiter-only posting/management on this router."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from core.errors import ValidationError
from models.job import EmploymentType, ExperienceLevel, WorkMode
from schemas.job import (
    DatePostedFilter,
    JobDto,
    JobFilterOptions,
    JobMatchInput,
    JobMatchResult,
    JobSource,
    ToggleSaveInput,
    ToggleSaveResult,
)
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import job_match_service, job_service
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


@router.post("/{job_id}/save", response_model=ToggleSaveResult)
async def toggle_save_job_route(job_id: str, body: ToggleSaveInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> ToggleSaveResult:
    saved = await job_service.toggle_save(mongo_user_id, job_id, body.job)
    return ToggleSaveResult(saved=saved)


@router.post("/match", response_model=JobMatchResult | None)
async def score_job_match_route(
    body: JobMatchInput, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> JobMatchResult | None:
    """For external (jsearch) listings, which the backend can't fetch by id —
    the frontend already holds the full job from its search results and
    supplies it here, same pattern as ToggleSaveInput."""
    if not body.job:
        raise ValidationError("Job details are required to score a match for this listing.")
    return await job_match_service.score_job_match_for_user(db, mongo_user_id, body.job, body.resumeId)


@router.get("/{job_id}/match", response_model=JobMatchResult | None)
async def get_job_match_route(
    job_id: PydanticObjectId,
    db: DbDep,
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
    resumeId: PydanticObjectId | None = None,
) -> JobMatchResult | None:
    job = await job_service.get_by_id(job_id)
    return await job_match_service.score_job_match_for_user(db, mongo_user_id, job, resumeId)


@router.get("/{job_id}", response_model=JobDto)
async def get_job_route(job_id: PydanticObjectId, _user_id: UserIdDep) -> JobDto:
    return await job_service.get_by_id(job_id)
