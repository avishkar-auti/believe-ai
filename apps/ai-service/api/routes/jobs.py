from fastapi import APIRouter

from agents.company_intel_agent import synthesize_company_intel
from agents.job_post_agent import draft_job_post
from agents.outreach_draft_agent import generate_outreach_draft
from api.dependencies import AuthorizedDep, SettingsDep
from schemas.ai import (
    CompanyIntelRequest,
    CompanyIntelResult,
    JobPostDraftRequest,
    JobPostDraftResult,
    OutreachDraftRequest,
    OutreachDraftResult,
)

router = APIRouter(prefix="/ai/jobs", tags=["ai"])


@router.post("/draft", response_model=JobPostDraftResult)
async def draft_job_post_route(
    body: JobPostDraftRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> JobPostDraftResult:
    return await draft_job_post(settings, body)


@router.post("/company-intel", response_model=CompanyIntelResult)
async def synthesize_company_intel_route(
    body: CompanyIntelRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> CompanyIntelResult:
    return await synthesize_company_intel(settings, body)


@router.post("/outreach-draft", response_model=OutreachDraftResult)
async def generate_outreach_draft_route(
    body: OutreachDraftRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> OutreachDraftResult:
    return await generate_outreach_draft(settings, body)
