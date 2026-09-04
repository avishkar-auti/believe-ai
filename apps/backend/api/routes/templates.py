"""Mirrors apps/api's template.routes.ts route shapes exactly. /preview is
registered before /{template_id} for the same static-vs-param ordering
reason as contacts.py."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from schemas.template import (
    CreateTemplateInput,
    TemplateDto,
    TemplatePreviewInput,
    TemplatePreviewResult,
    UpdateTemplateInput,
)
from services import audit_service, template_service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=list[TemplateDto])
async def list_templates_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[TemplateDto]:
    return await template_service.list_templates(mongo_user_id)


@router.post("/", response_model=TemplateDto, status_code=201)
async def create_template_route(body: CreateTemplateInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> TemplateDto:
    return await template_service.create(mongo_user_id, body)


@router.post("/preview", response_model=TemplatePreviewResult)
async def preview_template_route(body: TemplatePreviewInput, _user_id: UserIdDep) -> TemplatePreviewResult:
    subject, preview_body = template_service.preview(body.subject, body.body, body.bodyFormat, body.values)
    return TemplatePreviewResult(subject=subject, body=preview_body)


@router.get("/{template_id}", response_model=TemplateDto)
async def get_template_route(template_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> TemplateDto:
    return await template_service.get_by_id(template_id, mongo_user_id)


@router.patch("/{template_id}", response_model=TemplateDto)
async def update_template_route(
    template_id: PydanticObjectId, body: UpdateTemplateInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> TemplateDto:
    return await template_service.update(template_id, mongo_user_id, body)


@router.delete("/{template_id}")
async def delete_template_route(
    template_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, Literal[True]]:
    await template_service.delete(template_id, mongo_user_id)
    await audit_service.record(mongo_user_id, "template.deleted", "template", entity_id=str(template_id))
    return {"deleted": True}


@router.post("/{template_id}/duplicate", response_model=TemplateDto, status_code=201)
async def duplicate_template_route(template_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> TemplateDto:
    return await template_service.duplicate(template_id, mongo_user_id)
