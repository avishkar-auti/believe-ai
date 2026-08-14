"""Generates a new outreach email from a goal/target/tone brief."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import AiEmailGenerationRequest, AiEmailGenerationResult
from utils.sanitize import strip_html


async def generate_email(settings: Settings, req: AiEmailGenerationRequest) -> AiEmailGenerationResult:
    result = await with_fallback(settings, "generate_email", lambda p: p.generate_email(req))
    return result.model_copy(update={"body": strip_html(result.body)})
