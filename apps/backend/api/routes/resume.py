"""Mirrors apps/api's resume.routes.ts."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from api.dependencies import MongoUserIdDep, SettingsDep
from core.errors import ValidationError
from schemas.resume import ResumeDto
from services import resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("/", response_model=ResumeDto)
async def get_resume_route(mongo_user_id: MongoUserIdDep) -> ResumeDto:
    return await resume_service.get_by_user_id(mongo_user_id)


@router.post("/", response_model=ResumeDto, status_code=201)
async def upload_resume_route(settings: SettingsDep, mongo_user_id: MongoUserIdDep, file: Annotated[UploadFile, File()]) -> ResumeDto:
    if not file.filename:
        raise ValidationError("Resume file is required (field name: file)")
    data = await file.read()
    return await resume_service.upload(settings, mongo_user_id, file.filename, file.content_type or "", data)


@router.delete("/")
async def delete_resume_route(mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await resume_service.delete(mongo_user_id)
    return {"deleted": True}
