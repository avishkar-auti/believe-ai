"""The deliberately public routes in this API — no auth dependency, hit
directly by anonymous browsers loading believe.ai/u/<username> and by plain
<img src> tags loading a user's avatar/cover (which can't attach a bearer
token). Mirrors api/routes/tracking.py's "public routes hit directly, no
auth" pattern."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter, Response

from schemas.user import PublicProfileDto
from services import profile_image_service, public_profile_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/profile/{username}", response_model=PublicProfileDto)
async def get_public_profile_route(username: str) -> PublicProfileDto:
    return await public_profile_service.get_public_profile(username)


@router.get("/avatar/{user_id}")
async def get_avatar_route(user_id: PydanticObjectId) -> Response:
    doc = await profile_image_service.get_image(user_id, "avatar")
    return Response(content=doc.data, media_type=doc.contentType)


@router.get("/cover/{user_id}")
async def get_cover_route(user_id: PydanticObjectId) -> Response:
    doc = await profile_image_service.get_image(user_id, "cover")
    return Response(content=doc.data, media_type=doc.contentType)
