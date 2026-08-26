"""Rewrites an existing email per a requested improvement action."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import AiImproveRequest, ImproveResult
from utils.sanitize import strip_html


async def improve_email(settings: Settings, req: AiImproveRequest) -> ImproveResult:
    result = await with_fallback(settings, "improve_email", lambda p: p.improve_email(req))
    return result.model_copy(update={"body": strip_html(result.body)})
