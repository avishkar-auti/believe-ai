"""MCP tool wrapping the email-writer agent — same agent the REST route
uses, so the two surfaces can never drift apart."""

from __future__ import annotations

from agents.email_writer_agent import generate_email
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import AiEmailGenerationRequest


@server.tool()
async def generate_outreach_email(goal: str, target: str, tone: str, context: str | None = None) -> dict:
    """Generate a personalized outreach email as {subject, body, cta}.

    Args:
        goal: What the email is trying to achieve, e.g. "ask about backend roles".
        target: Who the recipient is, e.g. "senior recruiter at a fintech startup".
        tone: Desired tone, e.g. "professional and friendly".
        context: Optional background about the sender to reference.
    """
    settings = get_settings()
    req = AiEmailGenerationRequest(goal=goal, target=target, tone=tone, context=context)
    result = await generate_email(settings, req)
    return result.model_dump()
