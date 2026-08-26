"""Job Intelligence — mirrors apps/api's jobIntel.service.ts. Step A
(rule-based parsing, no LLM) then Step B (AI-synthesized company intel,
grounded in real public snippets). Everything — the fetch, the parse, the
snippet lookup, and the one LLM synthesis call — now runs in this single
service; Node's version had to split the LLM step out over HTTP since AI
lived in a separate process. It doesn't here.
"""

from __future__ import annotations

from bson import ObjectId

from agents.company_intel_agent import synthesize_company_intel
from clients.company_snippets_client import fetch_company_snippets
from clients.job_posting_fetch_client import fetch_job_posting_text
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.job_intel import JobIntel
from repositories import job_intel_repository
from schemas.ai import CompanyIntelConfidence, CompanyIntelRequest, CompanyIntelResult
from schemas.job_intel import JobIntelDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages
from services.job_parsing import parse_job_posting

# Below this, no fetch path got anything resembling a posting — an unreachable/blocked page
# yields "", and a client-rendered shell yields just its <title> (14-60 chars observed).
_MIN_USABLE_POSTING_CHARS = 80

_CONFIDENCE_FIELDS = ("employeeCount", "techStack", "funding", "hiringTrend")


def _to_dto(doc: JobIntel) -> JobIntelDto:
    return JobIntelDto(
        id=str(doc.id),
        userId=str(doc.userId),
        jobUrl=doc.jobUrl,
        company=doc.company,
        roleTitle=doc.roleTitle,
        skills=doc.skills,
        experienceLevel=doc.experienceLevel,
        location=doc.location,
        hiringTeamNames=doc.hiringTeamNames,
        atsKeywords=doc.atsKeywords,
        companyIntel=doc.companyIntel,
        parsingConfidence=doc.parsingConfidence,
        createdAt=doc.createdAt.isoformat(),
    )


def _empty_company_intel() -> CompanyIntelResult:
    return CompanyIntelResult(
        employeeCount=None,
        techStack=[],
        funding=None,
        hiringTrend=None,
        confidence=CompanyIntelConfidence(employeeCount="low", techStack="low", funding="low", hiringTrend="low"),
    )


async def analyze(settings: Settings, user_id: ObjectId, job_url: str) -> JobIntelDto:
    # UnsafeJobUrlError (a ValidationError) propagates as-is — already a specific,
    # user-facing message ("that's a private address", "missing http://").
    raw_text = await fetch_job_posting_text(job_url)

    if len(raw_text.strip()) < _MIN_USABLE_POSTING_CHARS:
        raise ValidationError(
            "We couldn't read a job description at that link. It may require a login, have expired, "
            "or be behind a bot check. Try the posting's direct URL, or paste a different link."
        )

    parsed = parse_job_posting(raw_text, job_url)

    snippets = await fetch_company_snippets(parsed.company)
    if not snippets:
        company_intel = _empty_company_intel()
    else:
        synthesized = await synthesize_company_intel(settings, CompanyIntelRequest(company=parsed.company, snippets=snippets))
        # Confidence is recomputed here rather than trusted blindly: a field the model
        # claimed "high" confidence for but left null is self-contradictory.
        confidence_values: dict[str, str] = {}
        for field_name in _CONFIDENCE_FIELDS:
            value = getattr(synthesized, field_name)
            is_present = bool(value) if field_name == "techStack" else value is not None
            claimed = getattr(synthesized.confidence, field_name)
            confidence_values[field_name] = "high" if claimed == "high" and is_present else "low"

        company_intel = CompanyIntelResult(
            employeeCount=synthesized.employeeCount,
            techStack=synthesized.techStack,
            funding=synthesized.funding,
            hiringTrend=synthesized.hiringTrend,
            confidence=CompanyIntelConfidence(**confidence_values),  # type: ignore[arg-type]
        )

    doc = await job_intel_repository.create(
        user_id,
        job_url=job_url,
        company=parsed.company,
        role_title=parsed.roleTitle,
        skills=parsed.skills,
        experience_level=parsed.experienceLevel,
        location=parsed.location,
        hiring_team_names=parsed.hiringTeamNames,
        ats_keywords=parsed.atsKeywords,
        company_intel=company_intel,
        parsing_confidence=parsed.parsingConfidence,
    )
    return _to_dto(doc)


async def list_job_intel(user_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE) -> PaginatedResult[JobIntelDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    items, total = await job_intel_repository.list_for_user(user_id, safe_page_, safe_limit_)
    return PaginatedResult[JobIntelDto](
        items=[_to_dto(doc) for doc in items],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )


async def get_by_id(job_intel_id: ObjectId, user_id: ObjectId) -> JobIntelDto:
    doc = await job_intel_repository.find_by_id(job_intel_id, user_id)
    if not doc:
        raise NotFoundError("Job analysis not found")
    return _to_dto(doc)


async def delete(job_intel_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await job_intel_repository.delete(job_intel_id, user_id)
    if not deleted:
        raise NotFoundError("Job analysis not found")
