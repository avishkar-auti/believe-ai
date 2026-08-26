"""Practice-room question generation: open-ended discussion prompts for a
group, not grounded in any one participant's resume."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import RoomQuestionsRequest, RoomQuestionsResult


async def generate_room_questions(settings: Settings, req: RoomQuestionsRequest) -> RoomQuestionsResult:
    return await with_fallback(settings, "generate_room_questions", lambda p: p.generate_room_questions(req))
