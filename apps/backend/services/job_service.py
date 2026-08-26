"""Job Board — mirrors apps/api's job.service.ts, including the internal +
external (JSearch) result merge and the saved-jobs bypass path."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId

from clients.jsearch_client import search_external_jobs
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.job import Job
from models.saved_job import JobSnapshot, SavedJob
from repositories import job_repository, saved_job_repository
from repositories.job_repository import JobSearchFilters as RepoJobSearchFilters
from schemas.job import CreateJobInput, DatePostedFilter, JobDto, JobFilterOptions, LocationOption, UpdateJobInput
from schemas.pagination import PaginatedResult, safe_limit, safe_page, total_pages
from services.location_parsing import matches as location_matches
from services.location_parsing import parse_location

_DATE_POSTED_DELTA = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


@dataclass
class JobSearchFilters:
    q: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    company: str | None = None
    employmentType: str | None = None
    workMode: str | None = None
    experienceLevel: str | None = None
    skill: str | None = None
    source: str | None = None
    salaryMin: float | None = None
    datePosted: DatePostedFilter | None = None
    savedOnly: bool = False


def _date_posted_to_cutoff(date_posted: DatePostedFilter | None) -> datetime | None:
    if not date_posted or date_posted == "any":
        return None
    return datetime.now(UTC) - _DATE_POSTED_DELTA[date_posted]


def _meets_salary_floor(job: JobDto, floor: float | None) -> bool:
    if floor is None:
        return True
    ceiling = job.salaryMax if job.salaryMax is not None else job.salaryMin
    return ceiling is not None and ceiling >= floor


def _to_dto(doc: Job) -> JobDto:
    return JobDto(
        id=str(doc.id),
        source="internal",
        postedBy=str(doc.postedBy),
        title=doc.title,
        company=doc.company,
        location=doc.location,
        description=doc.description,
        skills=doc.skills,
        employmentType=doc.employmentType,
        workMode=doc.workMode,
        experienceLevel=doc.experienceLevel,
        salaryMin=doc.salaryMin,
        salaryMax=doc.salaryMax,
        recruiterLinkedIn=doc.recruiterLinkedIn,
        applyUrl=doc.applyUrl,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _to_saved_dto(doc: SavedJob) -> JobDto:
    s = doc.snapshot
    created = doc.createdAt.isoformat()
    return JobDto(
        id=doc.jobId,
        source=s.source,  # type: ignore[arg-type]
        postedBy=None,
        title=s.title,
        company=s.company,
        location=s.location,
        description=s.description,
        skills=s.skills,
        employmentType=s.employmentType,
        workMode=s.workMode,
        experienceLevel=s.experienceLevel,
        salaryMin=s.salaryMin,
        salaryMax=s.salaryMax,
        recruiterLinkedIn=s.recruiterLinkedIn,
        applyUrl=s.applyUrl,
        createdAt=created,
        updatedAt=created,
        isSaved=True,
    )


def _snapshot_from_dto(job: JobDto) -> JobSnapshot:
    return JobSnapshot(
        source=job.source,
        title=job.title,
        company=job.company,
        location=job.location,
        description=job.description,
        skills=job.skills,
        employmentType=job.employmentType,
        workMode=job.workMode,
        experienceLevel=job.experienceLevel,
        salaryMin=job.salaryMin,
        salaryMax=job.salaryMax,
        recruiterLinkedIn=job.recruiterLinkedIn,
        applyUrl=job.applyUrl,
    )


async def search(settings: Settings, filters: JobSearchFilters, page: int, limit: int, user_id: ObjectId) -> PaginatedResult[JobDto]:
    """Internal listings (paginated, always shown) plus a best-effort page of
    external results (only when searching with a keyword — JSearch has no
    "browse all" concept — and only when source isn't restricted to
    "internal"). savedOnly bypasses this entirely and reads bookmarked
    snapshots instead, since a saved external listing has no other home
    once it falls off a live search page."""
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)

    if filters.savedOnly:
        saved = await saved_job_repository.list_by_user(user_id)
        start = (safe_page_ - 1) * safe_limit_
        page_docs = saved[start : start + safe_limit_]
        return PaginatedResult[JobDto](
            items=[_to_saved_dto(doc) for doc in page_docs],
            page=safe_page_,
            limit=safe_limit_,
            total=len(saved),
            totalPages=total_pages(len(saved), safe_limit_),
        )

    posted_after = _date_posted_to_cutoff(filters.datePosted)
    include_external = filters.source != "internal" and bool(filters.q)
    has_location_filter = bool(filters.country or filters.state or filters.city)

    location_raws: list[str] | None = None
    if has_location_filter:
        location_raws = await job_repository.raw_locations_matching(filters.country, filters.state, filters.city)

    (internal_docs, total), external_raw, saved_ids = (
        await job_repository.search(
            RepoJobSearchFilters(
                query=filters.q,
                locationRaws=location_raws,
                company=filters.company,
                employmentType=filters.employmentType,  # type: ignore[arg-type]
                workMode=filters.workMode,  # type: ignore[arg-type]
                experienceLevel=filters.experienceLevel,  # type: ignore[arg-type]
                skill=filters.skill,
                source=filters.source,  # type: ignore[arg-type]
                salaryMin=filters.salaryMin,
                postedAfter=posted_after,
            ),
            safe_page_,
            safe_limit_,
        ),
        (await search_external_jobs(settings, filters.q, filters.datePosted) if include_external and filters.q else []),
        await saved_job_repository.saved_job_ids(user_id),
    )

    # External results can't be filtered server-side by salary or structured location (JSearch
    # doesn't expose either as a query param), so both are applied here against the fields it does return.
    external = [
        j
        for j in external_raw
        if _meets_salary_floor(j, filters.salaryMin)
        and (not has_location_filter or location_matches(parse_location(j.location), filters.country, filters.state, filters.city))
    ]

    items = [item.model_copy(update={"isSaved": item.id in saved_ids}) for item in [*[_to_dto(d) for d in internal_docs], *external]]

    return PaginatedResult[JobDto](items=items, page=safe_page_, limit=safe_limit_, total=total, totalPages=total_pages(total, safe_limit_))


async def get_filter_options() -> JobFilterOptions:
    locations, location_triples, companies, skills = await job_repository.distinct_facets()
    location_options = [LocationOption(country=c, state=s, city=ci) for c, s, ci in location_triples]
    return JobFilterOptions(locations=locations, locationOptions=location_options, companies=companies, skills=skills)


async def toggle_save(user_id: ObjectId, job_id: str, job_payload: JobDto | None) -> bool:
    """Toggles a bookmark. Saving needs the job's display fields — for internal jobs we can
    re-fetch them, but external (jsearch) jobs only exist as a live API response, so the
    caller must supply them. Returns True if now saved, False if now unsaved."""
    existing = await saved_job_repository.find(user_id, job_id)
    if existing:
        await saved_job_repository.unsave(user_id, job_id)
        return False

    job = job_payload
    if not job and not job_id.startswith("jsearch:"):
        doc = await job_repository.find_by_id(ObjectId(job_id))
        if doc:
            job = _to_dto(doc)
    if not job:
        raise ValidationError("Job details are required to save this listing.")

    await saved_job_repository.save(user_id, job_id, _snapshot_from_dto(job))
    return True


async def get_by_id(job_id: ObjectId) -> JobDto:
    doc = await job_repository.find_by_id(job_id)
    if not doc:
        raise NotFoundError("Job not found")
    return _to_dto(doc)


async def list_mine(user_id: ObjectId) -> list[JobDto]:
    docs = await job_repository.list_by_poster(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreateJobInput) -> JobDto:
    doc = await job_repository.create(user_id, input_.model_dump())
    return _to_dto(doc)


async def update(job_id: ObjectId, user_id: ObjectId, input_: UpdateJobInput) -> JobDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await job_repository.update(job_id, user_id, updates)
    if not doc:
        raise NotFoundError("Job not found")
    return _to_dto(doc)


async def delete(job_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await job_repository.delete(job_id, user_id)
    if not deleted:
        raise NotFoundError("Job not found")
