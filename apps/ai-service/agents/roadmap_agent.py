"""Builds a staged learning roadmap toward a stated goal, grounded in the resume."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import RoadmapRequest, RoadmapResult


async def build_roadmap(settings: Settings, req: RoadmapRequest) -> RoadmapResult:
    return await with_fallback(settings, "build_roadmap", lambda p: p.build_roadmap(req))
