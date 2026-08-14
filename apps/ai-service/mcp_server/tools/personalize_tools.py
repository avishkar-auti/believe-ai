from __future__ import annotations

from agents.personalization_agent import personalize_email
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import AiPersonalizeRequest, ContactPersonalizationInput


@server.tool()
async def personalize_outreach_email(
    template_subject: str,
    template_body: str,
    first_name: str,
    last_name: str,
    company: str | None = None,
    job_title: str | None = None,
    sender_context: str | None = None,
) -> dict:
    """Personalize a template for one recipient using only the contact data given.

    Never fabricates facts about the recipient beyond what's passed in.
    """
    settings = get_settings()
    req = AiPersonalizeRequest(
        templateSubject=template_subject,
        templateBody=template_body,
        contact=ContactPersonalizationInput(
            firstName=first_name, lastName=last_name, company=company, jobTitle=job_title
        ),
        senderContext=sender_context,
    )
    result = await personalize_email(settings, req)
    return result.model_dump()
