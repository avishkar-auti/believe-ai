"""MCP tool wrapping the email-writer agent — same agent the REST route
uses, so the two surfaces can never drift apart."""

from __future__ import annotations

from agents.email_writer_agent import generate_email
from agents.template_chat_agent import chat_about_template
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import AiEmailGenerationRequest, TemplateChatMessage, TemplateChatRequest


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


@server.tool()
async def draft_email_template_chat(
    message: str,
    history: list[dict] | None = None,
    current_subject: str | None = None,
    current_body: str | None = None,
) -> dict:
    """Iteratively draft or edit a reusable email template through conversation, as {reply, subject, body}.

    Args:
        message: The user's instruction for this turn, e.g. "make it shorter" or "write one for cold outreach to recruiters".
        history: Prior turns as [{"role": "user"|"assistant", "content": str}, ...], oldest first.
        current_subject: The draft's current subject line, if one exists yet.
        current_body: The draft's current body, if one exists yet.
    """
    settings = get_settings()
    req = TemplateChatRequest(
        message=message,
        history=[TemplateChatMessage(**msg) for msg in (history or [])],
        currentSubject=current_subject,
        currentBody=current_body,
    )
    result = await chat_about_template(settings, req)
    return result.model_dump()
