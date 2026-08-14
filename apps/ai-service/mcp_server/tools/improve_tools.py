from __future__ import annotations

from agents.improvement_agent import improve_email
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import AiImproveAction, AiImproveRequest


@server.tool()
async def improve_outreach_email(subject: str, body: str, action: AiImproveAction) -> dict:
    """Rewrite an existing email subject/body per the requested improvement action.

    Args:
        subject: Current email subject.
        body: Current email body.
        action: One of make_shorter, make_professional, make_friendly,
            make_persuasive, make_concise, fix_grammar, rewrite.
    """
    settings = get_settings()
    req = AiImproveRequest(subject=subject, body=body, action=action)
    result = await improve_email(settings, req)
    return result.model_dump()
