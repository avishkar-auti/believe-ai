"""Personalizes a template for one recipient using only the contact data
given — never fabricates facts about the recipient (spec 5.21)."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import AiPersonalizeRequest, AiPersonalizeResult
from utils.sanitize import strip_html


async def personalize_email(settings: Settings, req: AiPersonalizeRequest) -> AiPersonalizeResult:
    result = await with_fallback(settings, "personalize_email", lambda p: p.personalize_email(req))
    return result.model_copy(update={"body": strip_html(result.body)})
