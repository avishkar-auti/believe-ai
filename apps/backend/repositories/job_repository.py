"""Beanie-backed job board access — mirrors apps/api's job.repository.ts
query-for-query. Search is a simple case-insensitive match plus exact-match
facet filters — enough at this scale."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.job import EmploymentType, ExperienceLevel, Job, JobSource, WorkMode
from services.location_parsing import matches as location_matches
from services.location_parsing import parse_location


@dataclass
class JobSearchFilters:
    query: str | None = None
    # Resolved by the service layer from country/state/city selections down to the
    # exact raw `location` strings that match — Mongo has no structured geo fields
    # to filter on directly. None means "no location filter"; an empty list means
    # "filter applied, nothing matched" and should yield zero results.
    locationRaws: list[str] | None = None
    company: str | None = None
    employmentType: EmploymentType | None = None
    workMode: WorkMode | None = None
    experienceLevel: ExperienceLevel | None = None
    skill: str | None = None
    # All jobs in this repository are "internal" — an explicit "jsearch" filter
    # short-circuits to zero results, handled by the caller.
    source: JobSource | None = None
    salaryMin: float | None = None
    postedAfter: datetime | None = None


def _escape_regex(value: str) -> str:
    return re.escape(value)


def _build_filter(filters: JobSearchFilters) -> dict[str, Any]:
    clauses: list[dict[str, Any]] = []

    if filters.query:
        pattern = re.compile(_escape_regex(filters.query), re.IGNORECASE)
        clauses.append({"$or": [{"title": pattern}, {"company": pattern}, {"skills": pattern}]})
    if filters.locationRaws is not None:
        clauses.append({"location": {"$in": filters.locationRaws}})
    if filters.company:
        clauses.append({"company": filters.company})
    if filters.employmentType:
        clauses.append({"employmentType": filters.employmentType})
    if filters.workMode:
        clauses.append({"workMode": filters.workMode})
    if filters.experienceLevel:
        clauses.append({"experienceLevel": filters.experienceLevel})
    if filters.skill:
        clauses.append({"skills": re.compile(_escape_regex(filters.skill), re.IGNORECASE)})
    if filters.salaryMin is not None:
        clauses.append(
            {
                "$or": [
                    {"salaryMax": {"$gte": filters.salaryMin}},
                    {"salaryMax": None, "salaryMin": {"$gte": filters.salaryMin}},
                ]
            }
        )
    if filters.postedAfter:
        clauses.append({"createdAt": {"$gte": filters.postedAfter}})

    return {"$and": clauses} if clauses else {}


async def search(filters: JobSearchFilters, page: int, limit: int) -> tuple[list[Job], int]:
    # Every row here is source: "internal" — an explicit external-only filter means no matches at
    # all, but the query still needs to run so the return type lines up with the normal path.
    filter_ = {"_id": None} if filters.source == "jsearch" else _build_filter(filters)
    skip = (page - 1) * limit
    items = await Job.find(filter_).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await Job.find(filter_).count()
    return items, total


async def distinct_facets() -> tuple[list[str], list[tuple[str | None, str | None, str | None]], list[str], list[str]]:
    """Distinct facet values for the filter sidebar, capped so a huge board doesn't blow up the dropdown."""
    collection = Job.get_pymongo_collection()
    locations = sorted(await collection.distinct("location", {"location": {"$ne": None}}))[:100]
    companies = sorted(await collection.distinct("company"))[:100]
    skills = sorted(await collection.distinct("skills"))[:100]

    seen: set[tuple[str | None, str | None, str | None]] = set()
    location_triples: list[tuple[str | None, str | None, str | None]] = []
    for raw in locations:
        parsed = parse_location(raw)
        triple = (parsed.country, parsed.state, parsed.city)
        if triple not in seen:
            seen.add(triple)
            location_triples.append(triple)
    location_triples.sort(key=lambda t: (t[0] or "", t[1] or "", t[2] or ""))

    return locations, location_triples, companies, skills


async def raw_locations_matching(country: str | None, state: str | None, city: str | None) -> list[str]:
    """Resolves a country/state/city selection down to the exact raw `location`
    strings stored on jobs — the only way to filter Mongo by a field that isn't
    actually structured. Called only when at least one of the three is set."""
    collection = Job.get_pymongo_collection()
    locations = await collection.distinct("location", {"location": {"$ne": None}})
    return [raw for raw in locations if location_matches(parse_location(raw), country, state, city)]


async def find_by_id(job_id: ObjectId) -> Job | None:
    return await Job.get(job_id)


async def list_by_poster(user_id: ObjectId) -> list[Job]:
    return await Job.find(Job.postedBy == user_id).sort("-createdAt").to_list()


async def create(posted_by: ObjectId, data: dict[str, Any]) -> Job:
    doc = Job(postedBy=posted_by, **data)
    await doc.insert()
    return doc


async def update(job_id: ObjectId, posted_by: ObjectId, updates: dict[str, Any]) -> Job | None:
    doc = await Job.find_one(Job.id == job_id, Job.postedBy == posted_by)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(job_id: ObjectId, posted_by: ObjectId) -> bool:
    doc = await Job.find_one(Job.id == job_id, Job.postedBy == posted_by)
    if not doc:
        return False
    await doc.delete()
    return True
