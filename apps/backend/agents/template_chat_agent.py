"""Conversational email-template drafting/editing — the model returns the
full updated draft each turn, not a diff, so the caller can just replace its
local state with the response."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import TemplateChatRequest, TemplateChatResult
from utils.sanitize import strip_html


async def chat_about_template(settings: Settings, req: TemplateChatRequest) -> TemplateChatResult:
    result = await with_fallback(settings, "chat_about_template", lambda p: p.chat_about_template(req))
    return result.model_copy(update={"body": strip_html(result.body)})
