"""Mirrors apps/api's template.routes.ts route shapes exactly. /preview is
registered before /{template_id} for the same static-vs-param ordering
reason as contacts.py."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from bson import ObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from core.errors import NotFoundError
from repositories import user_repository
from schemas.template import (
    CreateTemplateInput,
    PersonalizationContextDto,
    PersonalizationVariableDto,
    TemplateDto,
    TemplatePreviewInput,
    TemplatePreviewResult,
    UpdateTemplateInput,
)
from services import audit_service, personalization, template_service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=list[TemplateDto])
async def list_templates_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[TemplateDto]:
    return await template_service.list_templates(mongo_user_id)


@router.post("/", response_model=TemplateDto, status_code=201)
async def create_template_route(body: CreateTemplateInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> TemplateDto:
    return await template_service.create(mongo_user_id, body)


async def _sender_values(mongo_user_id: ObjectId) -> dict[str, str]:
    user = await user_repository.find_by_id(mongo_user_id)
    if not user:
        raise NotFoundError("User not found")
    return personalization.sender_values_for_user(user)


@router.post("/preview", response_model=TemplatePreviewResult)
async def preview_template_route(
    body: TemplatePreviewInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> TemplatePreviewResult:
    """Sender variables are resolved here from the caller's own profile and
    override anything the client sent, so the preview shows what would
    actually go out — and editing your profile changes every preview with no
    template migration. Recipient values still come from the request: they're
    the caller's chosen preview contact, which the server has no way to
    guess."""
    sender = await _sender_values(mongo_user_id)
    recipient = {k: v for k, v in body.values.items() if personalization.canonical_key(k) not in personalization.SENDER_KEYS}
    subject, preview_body = template_service.preview(body.subject, body.body, body.bodyFormat, {**recipient, **sender})
    return TemplatePreviewResult(subject=subject, body=preview_body)


@router.get("/variables", response_model=PersonalizationContextDto)
async def template_variables_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> PersonalizationContextDto:
    """The variable picker's data source — the registry plus what each sender
    variable currently resolves to. Served rather than hardcoded client-side
    so the picker can show a real value (and a real "not set" state) instead
    of a placeholder that pretends everything is configured."""
    sender = await _sender_values(mongo_user_id)
    variables = [
        PersonalizationVariableDto(
            key=spec.key,
            token=f"{{{{{spec.key}}}}}",
            label=spec.label,
            group=spec.group,
            description=spec.description,
            required=spec.required,
            configured=spec.group == "recipient" or bool(sender.get(spec.key)),
            # Link variables resolve to <a> markup; show the plain URL in the
            # picker instead — the sibling *Url key holds exactly that.
            currentValue=(sender.get(f"{spec.key}Url") or sender.get(spec.key)) if spec.group == "sender" else None,
        )
        for spec in personalization.VARIABLES
    ]
    missing = [v.key for v in variables if v.group == "sender" and not v.configured]
    return PersonalizationContextDto(variables=variables, missingSenderKeys=missing)


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
