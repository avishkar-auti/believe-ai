"""Lead Discovery — finds real, named people at a company from the
company's own public team/about page (no paid LinkedIn API, no key). Step A
fetches that page's text (clients/company_team_client.py, cached per company
for 7 days). Step B has an LLM extract only people explicitly named in that
text (agents/team_extraction_agent.py) — grounded, never invented. Step C
ranks hiring-relevant titles first, infers a work-email pattern from the
company's guessed domain, and persists the result.

Everyone found this way is a snapshot of the company's current public team
page, not a career-history profile — there's no "prior companies" data
available from this source, so the old RapidAPI path's warm-path (shared
former employer) signal has no honest equivalent here and isn't faked.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import quote

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from agents.team_extraction_agent import extract_team_members
from clients.company_team_client import fetch_team_page_text
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.company_team_cache import CompanyTeamCache, TeamMemberEntry
from models.job_lead import JobLead
from repositories import contact_repository, job_intel_repository, job_lead_repository
from schemas.ai import TeamExtractionRequest
from schemas.job_lead import JobLeadDto

# Titles that count as "hiring team" for ranking purposes — matched loosely
# (substring, case-insensitive) against each extracted person's title.
_HIRING_TEAM_KEYWORDS = ["recruit", "engineering manager", "director of engineering", "hrbp", "hr business", "talent", "people"]
_MAX_LEADS_PER_JOB = 10


@dataclass
class _CandidateLead:
    name: str
    title: str | None
    rank: int


def _infer_company_domain(company: str) -> str | None:
    cleaned = re.sub(r"[^a-z0-9]", "", company.lower())
    return f"{cleaned}.com" if cleaned else None


def _infer_email_pattern(name: str, domain: str | None) -> str | None:
    if not domain:
        return None
    parts = [p for p in name.lower().split() if re.fullmatch(r"[a-z]+", p)]
    if len(parts) < 2:
        return None
    return f"{parts[0]}.{parts[-1]}@{domain}"

def _linkedin_search_url(name: str, company: str) -> str:
    """Not a verified profile — a real, clickable LinkedIn people-search link
    the user can follow to actually go find this person themselves."""
    return f"https://www.linkedin.com/search/results/people/?keywords={quote(f'{name} {company}')}"


def _rank_for_title(title: str | None) -> int:
    if not title:
        return 50
    lowered = title.lower()
    for i, keyword in enumerate(_HIRING_TEAM_KEYWORDS):
        if keyword in lowered:
            return i + 1
    return 40


async def _get_team_members(settings: Settings, company: str) -> list[TeamMemberEntry]:
    cached = await CompanyTeamCache.find_one(CompanyTeamCache.company == company.strip().lower())
    if cached:
        return cached.members

    page_text = await fetch_team_page_text(company)
    if not page_text:
        return []

    result = await extract_team_members(settings, TeamExtractionRequest(company=company, pageText=page_text))
    members = [TeamMemberEntry(name=m.name, title=m.title) for m in result.members if m.name.strip()]

    try:
        await CompanyTeamCache(company=company.strip().lower(), members=members).insert()
    except DuplicateKeyError:
        # A concurrent discover() call for the same company (e.g. a doubled-up
        # click) already cached it first — that write wins, this one just uses it.
        pass
    return members


def _to_dto(doc: JobLead) -> JobLeadDto:
    return JobLeadDto(
        id=str(doc.id),
        userId=str(doc.userId),
        jobIntelId=str(doc.jobIntelId),
        name=doc.name,
        title=doc.title,
        linkedinUrl=doc.linkedinUrl,
        relevanceRank=doc.relevanceRank,
        warmPath=doc.warmPath,
        warmPathReason=doc.warmPathReason,
        workEmailPattern=doc.workEmailPattern,
        addedContactId=str(doc.addedContactId) if doc.addedContactId else None,
        createdAt=doc.createdAt.isoformat(),
    )


async def discover(settings: Settings, user_id: ObjectId, job_intel_id: ObjectId) -> list[JobLeadDto]:
    job_intel = await job_intel_repository.find_by_id(job_intel_id, user_id)
    if not job_intel:
        raise NotFoundError("Job analysis not found")

    members = await _get_team_members(settings, job_intel.company)

    candidates = [_CandidateLead(name=m.name, title=m.title, rank=_rank_for_title(m.title)) for m in members]
    candidates.sort(key=lambda c: c.rank)
    capped = candidates[:_MAX_LEADS_PER_JOB]

    domain = _infer_company_domain(job_intel.company)

    await job_lead_repository.delete_unadded_by_job_intel(job_intel_id, user_id)
    to_insert = [
        JobLead(
            userId=user_id,
            jobIntelId=job_intel_id,
            name=c.name,
            title=c.title,
            linkedinUrl=_linkedin_search_url(c.name, job_intel.company),
            relevanceRank=i + 1,
            warmPath=False,
            warmPathReason=None,
            workEmailPattern=_infer_email_pattern(c.name, domain),
        )
        for i, c in enumerate(capped)
    ]
    created = await job_lead_repository.create_many(to_insert)
    return [_to_dto(doc) for doc in created]


async def list_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> list[JobLeadDto]:
    docs = await job_lead_repository.list_by_job_intel(job_intel_id, user_id)
    return [_to_dto(doc) for doc in docs]


async def add_to_contacts(lead_id: ObjectId, user_id: ObjectId, email: str) -> JobLeadDto:
    """The only path that can turn a discovered lead into a real, sendable
    Contact — requires the user to supply a real email themselves, since
    workEmailPattern is an inferred guess, never a verified address."""
    lead = await job_lead_repository.find_by_id(lead_id, user_id)
    if not lead:
        raise NotFoundError("Discovered contact not found")
    if lead.addedContactId:
        raise ValidationError("Already added to contacts")

    job_intel = await job_intel_repository.find_by_id(lead.jobIntelId, user_id)
    name_parts = lead.name.strip().split()
    first_name = name_parts[0] if name_parts else lead.name
    last_name = " ".join(name_parts[1:])

    contact = await contact_repository.create(
        user_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        company=job_intel.company if job_intel else None,
        job_title=lead.title,
        phone=None,
        tags=[],
        notes=f"LinkedIn: {lead.linkedinUrl}" if lead.linkedinUrl else None,
        source="manual",
        subscribed=True,
    )

    assert contact.id is not None
    updated = await job_lead_repository.mark_added(lead_id, user_id, contact.id)
    if not updated:
        raise NotFoundError("Discovered contact not found")
    return _to_dto(updated)
