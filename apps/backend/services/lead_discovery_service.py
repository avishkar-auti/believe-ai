"""Lead Discovery — finds real, publicly-indexed LinkedIn profiles relevant
to a job posting via SerpAPI (clients/serpapi_client.py). SerpAPI is not a
LinkedIn API: its only job is "find publicly indexed profile results
matching this query" — it says nothing about whether the user is connected
to any of them (that's services/relationship_service.py, deliberately
separate). Results are cached per company|location|role-category
(models/serp_lead_cache.py) so a second, similar search doesn't re-spend a
metered request, and every attempted call is logged
(models/external_api_usage.py) for auditing quota use.

Ranking is local and deterministic (never re-ordering by raw search rank),
producing an explainable 0-100 score plus the reasons behind it — see
_score_candidate.
"""

from __future__ import annotations

import re

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from clients.serpapi_client import NON_LOCATIONS, DiscoveredPerson, build_people_search_query, is_technical_role, search_people
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.external_api_usage import ExternalApiUsage
from models.job_lead import JobLead
from models.serp_lead_cache import CachedPersonEntry, SerpLeadCache
from repositories import contact_repository, job_intel_repository, job_lead_repository
from schemas.job_lead import JobLeadDto
from services import relationship_service

_MAX_LEADS_PER_JOB = 5

_RECRUITER_TALENT_RE = re.compile(r"recruit|talent acquisition|talent partner", re.IGNORECASE)
_HIRING_MANAGER_RE = re.compile(r"hiring manager|engineering manager|software engineering manager|technical manager", re.IGNORECASE)
_TECHNICAL_RECRUITING_RE = re.compile(r"technical recruit|engineering recruit", re.IGNORECASE)
_STOPWORDS = {"the", "and", "with", "senior", "junior", "staff", "principal", "lead"}


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


def _score_candidate(person: DiscoveredPerson, company: str, location: str | None, role_title: str) -> tuple[int, list[str]]:
    """Deterministic, explainable — every point added or removed has a
    stated reason, never a black-box similarity number."""
    headline = (person.headline or "").lower()
    company_lower = company.strip().lower()
    score = 0
    reasons: list[str] = []
    is_recruiting_title = bool(_RECRUITER_TALENT_RE.search(headline))
    is_manager_title = bool(_HIRING_MANAGER_RE.search(headline))

    if company_lower and company_lower in headline:
        score += 35
        reasons.append(f"Works at {company}")
    else:
        # The search query already required the company name to appear
        # somewhere on the page, just not necessarily in this headline
        # snippet — a soft penalty, not proof this person has moved on.
        score -= 30

    if is_recruiting_title:
        score += 25
        reasons.append("Recruiting / talent acquisition title")

    if is_manager_title:
        score += 20
        reasons.append("Hiring or engineering manager title")

    if _TECHNICAL_RECRUITING_RE.search(headline):
        score += 10
        reasons.append("Technical recruiting title")

    city = (location or "").split(",")[0].strip().lower()
    if city and city not in NON_LOCATIONS and city in headline:
        score += 10
        reasons.append("Location matches")

    role_words = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", role_title) if w.lower() not in _STOPWORDS}
    if any(w in headline for w in role_words):
        score += 5
        reasons.append("Role/domain overlap")

    if not (is_recruiting_title or is_manager_title):
        score -= 40

    return max(0, min(100, score)), reasons


async def _get_candidate_people(
    settings: Settings, user_id: ObjectId, company: str, role_title: str, location: str | None, skills: list[str]
) -> list[DiscoveredPerson]:
    city = (location or "").split(",")[0].strip().lower()
    category = "technical" if is_technical_role(role_title, skills) else "business"
    cache_key = f"{company.strip().lower()}|{city}|{category}"

    cached = await SerpLeadCache.find_one(SerpLeadCache.cacheKey == cache_key)
    if cached:
        return [DiscoveredPerson(name=m.name, headline=m.headline, profileUrl=m.profileUrl) for m in cached.people]

    query = build_people_search_query(company, role_title, location, skills)
    result = await search_people(settings, query)

    if result.attempted:
        await ExternalApiUsage(provider="serpapi", endpoint="search_people", userId=user_id, success=result.success).insert()

    if not result.success:
        return []

    try:
        await SerpLeadCache(
            cacheKey=cache_key,
            people=[CachedPersonEntry(name=p.name, headline=p.headline, profileUrl=p.profileUrl) for p in result.people],
        ).insert()
    except DuplicateKeyError:
        # A concurrent discover() call for the same key already cached it
        # first — that write wins, this one just uses the fresh result in hand.
        pass

    return result.people


def _to_dto(doc: JobLead) -> JobLeadDto:
    return JobLeadDto(
        id=str(doc.id),
        userId=str(doc.userId),
        jobIntelId=str(doc.jobIntelId),
        name=doc.name,
        title=doc.title,
        headline=doc.headline,
        location=doc.location,
        linkedinUrl=doc.linkedinUrl,
        relevanceRank=doc.relevanceRank,
        relevanceScore=doc.relevanceScore,
        relevanceReasons=doc.relevanceReasons,
        relationshipStatus=doc.relationshipStatus,
        warmPath=doc.warmPath,
        warmPathReason=doc.warmPathReason,
        workEmailPattern=doc.workEmailPattern,
        addedContactId=str(doc.addedContactId) if doc.addedContactId else None,
        createdAt=doc.createdAt.isoformat(),
    )


async def discover(
    settings: Settings,
    user_id: ObjectId,
    job_intel_id: ObjectId,
    *,
    broaden: bool = False,
    location_override: str | None = None,
) -> list[JobLeadDto]:
    job_intel = await job_intel_repository.find_by_id(job_intel_id, user_id)
    if not job_intel:
        raise NotFoundError("Job analysis not found")

    # "Broaden search" drops the location constraint entirely (searches
    # company + title only). An explicit override replaces the parsed
    # location with whatever the user typed instead — their extracted
    # location may have been wrong, or the role may be open elsewhere. Both
    # flow into the same cache key as any other location would, so a
    # broadened or overridden search gets its own cache entry rather than
    # colliding with (or being masked by) the original one.
    effective_location = None if broaden else (location_override or job_intel.location)

    people = await _get_candidate_people(settings, user_id, job_intel.company, job_intel.roleTitle, effective_location, job_intel.skills)

    scored = [(person, *_score_candidate(person, job_intel.company, effective_location, job_intel.roleTitle)) for person in people]
    # A 0 score means both the company and the recruiting/hiring-manager-title
    # checks failed — padding the results with a clearly-irrelevant profile
    # is worse than an honest "nothing found," per the brief's own empty-state.
    relevant = [entry for entry in scored if entry[1] > 0]
    relevant.sort(key=lambda entry: entry[1], reverse=True)
    capped = relevant[:_MAX_LEADS_PER_JOB]

    domain = _infer_company_domain(job_intel.company)

    await job_lead_repository.delete_unadded_by_job_intel(job_intel_id, user_id)
    to_insert = [
        JobLead(
            userId=user_id,
            jobIntelId=job_intel_id,
            name=person.name,
            title=person.headline,
            headline=person.headline,
            location=effective_location,
            linkedinUrl=person.profileUrl,
            relevanceRank=i + 1,
            relevanceScore=score,
            relevanceReasons=reasons,
            relationshipStatus=await relationship_service.get_relationship_status(person.profileUrl),
            warmPath=False,
            warmPathReason=None,
            workEmailPattern=_infer_email_pattern(person.name, domain),
        )
        for i, (person, score, reasons) in enumerate(capped)
    ]
    created = await job_lead_repository.create_many(to_insert)
    return [_to_dto(doc) for doc in created]


async def list_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> list[JobLeadDto]:
    docs = await job_lead_repository.list_by_job_intel(job_intel_id, user_id)
    return [_to_dto(doc) for doc in docs]


async def add_to_contacts(lead_id: ObjectId, user_id: ObjectId, email: str | None) -> JobLeadDto:
    """The only path that can turn a discovered lead into a real Contact.

    Two channels: a real, user-supplied email (workEmailPattern is only ever
    an inferred guess, never sent as-is) enables the existing full email
    flow, or — when the user just wants the generated LinkedIn message and
    never intends to email this person — email is omitted entirely and the
    contact is created with a placeholder address plus
    outreachChannel="linkedin", which outreach_send_service checks to skip
    the email-send attempt altogether."""
    lead = await job_lead_repository.find_by_id(lead_id, user_id)
    if not lead:
        raise NotFoundError("Discovered contact not found")
    if lead.addedContactId:
        raise ValidationError("Already added to contacts")

    job_intel = await job_intel_repository.find_by_id(lead.jobIntelId, user_id)
    name_parts = lead.name.strip().split()
    first_name = name_parts[0] if name_parts else lead.name
    last_name = " ".join(name_parts[1:])

    outreach_channel = "email" if email else "linkedin"
    contact_email = email or f"lead-{lead_id}@leads.believe.ai"

    contact = await contact_repository.create(
        user_id,
        first_name=first_name,
        last_name=last_name,
        email=contact_email,
        company=job_intel.company if job_intel else None,
        job_title=lead.title,
        phone=None,
        tags=[],
        notes=f"LinkedIn: {lead.linkedinUrl}" if lead.linkedinUrl else None,
        source="manual",
        subscribed=True,
        outreach_channel=outreach_channel,
    )

    assert contact.id is not None
    updated = await job_lead_repository.mark_added(lead_id, user_id, contact.id)
    if not updated:
        raise NotFoundError("Discovered contact not found")
    return _to_dto(updated)
