"""Mirrors apps/api's resume.routes.ts, extended for many-resumes-per-user."""

from __future__ import annotations

from typing import Annotated, Literal

from beanie import PydanticObjectId
from fastapi import APIRouter, File, UploadFile

from api.dependencies import MongoUserIdDep, SettingsDep
from core.errors import ValidationError
from schemas.resume import ResumeDto, UpdateResumeInput
from services import resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("/", response_model=list[ResumeDto])
async def list_resumes_route(mongo_user_id: MongoUserIdDep) -> list[ResumeDto]:
    return await resume_service.list_for_user(mongo_user_id)


@router.post("/", response_model=ResumeDto, status_code=201)
async def upload_resume_route(
    settings: SettingsDep, mongo_user_id: MongoUserIdDep, file: Annotated[UploadFile, File()], targetRole: str | None = None
) -> ResumeDto:
    if not file.filename:
        raise ValidationError("Resume file is required (field name: file)")
    data = await file.read()
    return await resume_service.upload(settings, mongo_user_id, file.filename, file.content_type or "", data, targetRole)


@router.get("/{resume_id}", response_model=ResumeDto)
async def get_resume_route(resume_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> ResumeDto:
    return await resume_service.get_by_id(mongo_user_id, resume_id)


@router.patch("/{resume_id}", response_model=ResumeDto)
async def update_resume_route(resume_id: PydanticObjectId, body: UpdateResumeInput, mongo_user_id: MongoUserIdDep) -> ResumeDto:
    return await resume_service.update(mongo_user_id, resume_id, body.targetRole)


@router.patch("/{resume_id}/primary", response_model=ResumeDto)
async def set_primary_resume_route(resume_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> ResumeDto:
    return await resume_service.set_primary(mongo_user_id, resume_id)


@router.delete("/{resume_id}")
async def delete_resume_route(resume_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await resume_service.delete(mongo_user_id, resume_id)
    return {"deleted": True}
