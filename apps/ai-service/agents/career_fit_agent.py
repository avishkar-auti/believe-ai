"""Assesses a resume's fit against the job market (or a specific target role)."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import CareerFitRequest, CareerFitResult


async def analyze_career_fit(settings: Settings, req: CareerFitRequest) -> CareerFitResult:
    return await with_fallback(settings, "analyze_career_fit", lambda p: p.analyze_career_fit(req))
