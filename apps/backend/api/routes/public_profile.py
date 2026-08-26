"""The one deliberately public route in this API — no auth dependency, hit
directly by anonymous browsers loading believe.ai/u/<username>. Mirrors
api/routes/tracking.py's "public routes hit directly, no auth" pattern."""

from __future__ import annotations

from fastapi import APIRouter

from schemas.user import PublicProfileDto
from services import public_profile_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/profile/{username}", response_model=PublicProfileDto)
async def get_public_profile_route(username: str) -> PublicProfileDto:
    return await public_profile_service.get_public_profile(username)
