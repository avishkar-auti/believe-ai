"""Expands a recruiter's rough notes into a full job posting draft. Stateless
— no resume or other stored data involved, same shape as email_writer_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import JobPostDraftRequest, JobPostDraftResult


async def draft_job_post(settings: Settings, req: JobPostDraftRequest) -> JobPostDraftResult:
    return await with_fallback(settings, "draft_job_post", lambda p: p.draft_job_post(req))
