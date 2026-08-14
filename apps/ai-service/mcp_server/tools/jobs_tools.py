"""MCP tool wrapping the job-post drafting agent — same agent the REST route
uses, so the two surfaces can never drift apart."""

from __future__ import annotations

from agents.job_post_agent import draft_job_post
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import JobPostDraftRequest


@server.tool()
async def draft_job_posting(role_title: str, company: str, brief_description: str, seniority: str | None = None) -> dict:
    """Expand rough recruiter notes into a complete job posting draft.

    Args:
        role_title: The role being hired for.
        company: The hiring company's name.
        brief_description: Rough notes about the role, responsibilities, requirements.
        seniority: Optional seniority level, e.g. "senior", "entry-level".
    """
    settings = get_settings()
    req = JobPostDraftRequest(roleTitle=role_title, company=company, briefDescription=brief_description, seniority=seniority)
    result = await draft_job_post(settings, req)
    return result.model_dump()
