"""Authenticated avatar/cover upload — mirrors api/routes/notes.py's
UploadFile pattern (upload_attachment_route). The GET side that actually
serves the bytes is deliberately public and lives in public_profile.py."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from api.dependencies import MongoUserIdDep
from schemas.user import UserDto
from services import profile_image_service

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/avatar", response_model=UserDto, status_code=201)
async def upload_avatar_route(mongo_user_id: MongoUserIdDep, file: Annotated[UploadFile, File()]) -> UserDto:
    data = await file.read()
    return await profile_image_service.upload(mongo_user_id, "avatar", file.filename or "avatar", file.content_type or "", data)


@router.delete("/avatar", response_model=UserDto)
async def delete_avatar_route(mongo_user_id: MongoUserIdDep) -> UserDto:
    return await profile_image_service.remove(mongo_user_id, "avatar")


@router.post("/cover", response_model=UserDto, status_code=201)
async def upload_cover_route(mongo_user_id: MongoUserIdDep, file: Annotated[UploadFile, File()]) -> UserDto:
    data = await file.read()
    return await profile_image_service.upload(mongo_user_id, "cover", file.filename or "cover", file.content_type or "", data)


@router.delete("/cover", response_model=UserDto)
async def delete_cover_route(mongo_user_id: MongoUserIdDep) -> UserDto:
    return await profile_image_service.remove(mongo_user_id, "cover")
