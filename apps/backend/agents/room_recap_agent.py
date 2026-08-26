"""Practice-room live recap: a short rolling summary of ideas + transcript
captured so far, for participants to skim mid-session."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import RoomRecapRequest, RoomRecapResult


async def generate_room_recap(settings: Settings, req: RoomRecapRequest) -> RoomRecapResult:
    return await with_fallback(settings, "generate_room_recap", lambda p: p.generate_room_recap(req))
