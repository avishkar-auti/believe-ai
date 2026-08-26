"""Practice-room post-call summary: a group recap plus one strength/growth-area
note per participant, synthesized from everything captured during the session."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import RoomSummaryRequest, RoomSummaryResult


async def generate_room_summary(settings: Settings, req: RoomSummaryRequest) -> RoomSummaryResult:
    return await with_fallback(settings, "generate_room_summary", lambda p: p.generate_room_summary(req))
