"""Thin with_fallback wrappers for Design Studio's two AI capabilities —
same shape as note_ai_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import DesignEditRequest, DesignEditResult, DesignGenerateRequest, DesignGenerateResult


async def generate_design_screen(settings: Settings, req: DesignGenerateRequest) -> DesignGenerateResult:
    return await with_fallback(settings, "generate_design_screen", lambda p: p.generate_design_screen(req))


async def edit_design_screen(settings: Settings, req: DesignEditRequest) -> DesignEditResult:
    return await with_fallback(settings, "edit_design_screen", lambda p: p.edit_design_screen(req))
