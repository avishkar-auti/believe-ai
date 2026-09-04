"""Mirrors apps/api's jsearch.client.ts — best-effort external job search
via RapidAPI's JSearch. Never raises: a slow or failing external API
shouldn't break the whole job board when internal listings are still
perfectly servable; failures are logged and the caller gets an empty list.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from core.config import Settings
from core.logging import get_logger
from models.job import EmploymentType
from schemas.job import DatePostedFilter, JobDto

logger = get_logger(__name__)

_EMPLOYMENT_TYPE_MAP: dict[str, EmploymentType] = {
    "FULLTIME": "full_time",
    "PARTTIME": "part_time",
    "CONTRACTOR": "contract",
    "INTERN": "internship",
}

# JSearch's own `date_posted` query values — "all" is the default when no filter is set.
_DATE_POSTED_MAP = {"24h": "today", "7d": "week", "30d": "month"}


def _to_job_dto(j: dict[str, Any]) -> JobDto:
    now = datetime.now(UTC).isoformat()
    location = ", ".join(filter(None, [j.get("job_city"), j.get("job_state"), j.get("job_country")])) or None
    employment_types = j.get("job_employment_types") or []
    employment_type_raw = employment_types[0] if employment_types else None
    posted_at = j.get("job_posted_at_datetime_utc") or now
    return JobDto(
        id=f"jsearch:{j['job_id']}",
        source="jsearch",
        postedBy=None,
        title=j.get("job_title") or "Untitled role",
        company=j.get("employer_name") or "Unknown company",
        location=location,
        description=j.get("job_description") or "",
        skills=j.get("job_required_skills") or [],
        employmentType=_EMPLOYMENT_TYPE_MAP.get(employment_type_raw) if employment_type_raw else None,
        # JSearch only tells us remote-or-not, not hybrid vs. on-site, so anything not remote is left unset.
        workMode="remote" if j.get("job_is_remote") else None,
        experienceLevel=None,
        salaryMin=j.get("job_min_salary"),
        salaryMax=j.get("job_max_salary"),
        recruiterLinkedIn=None,
        applyUrl=j.get("job_apply_link"),
        createdAt=posted_at,
        updatedAt=posted_at,
    )


async def search_external_jobs(
    settings: Settings, query: str, date_posted: DatePostedFilter | None = None, country: str | None = None
) -> list[JobDto]:
    if not settings.rapidapi_jsearch_key or not query:
        return []

    date_param = _DATE_POSTED_MAP.get(date_posted, "all") if date_posted and date_posted != "any" else "all"
    # JSearch defaults to "us" if the param is omitted, which silently hid every
    # non-US result (India included) regardless of what the user searched for or
    # filtered by — this now reflects the user's own country filter instead.
    country_param = country or "us"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                "https://jsearch.p.rapidapi.com/search-v2",
                params={"query": query, "num_pages": "1", "country": country_param, "date_posted": date_param},
                headers={
                    "X-RapidAPI-Key": settings.rapidapi_jsearch_key,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                },
            )
        if res.status_code >= 400:
            logger.warning("JSearch request failed (status=%s), showing internal jobs only", res.status_code)
            return []
        data = res.json()
        jobs = (data.get("data") or {}).get("jobs") or []
        return [_to_job_dto(j) for j in jobs]
    except Exception as err:  # noqa: BLE001 — best-effort external call, never blocks the board
        logger.warning("JSearch request errored, showing internal jobs only: %s", err)
        return []
