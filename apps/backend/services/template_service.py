"""Templates — mirrors apps/api's template.service.ts, including HTML
sanitization on write (templates and AI output are untrusted content) and
{{variable}} interpolation for preview."""

from __future__ import annotations

import re
from typing import Any

import nh3
from bson import ObjectId

from core.errors import NotFoundError
from models.template import Template
from repositories import template_repository
from schemas.template import CreateTemplateInput, TemplateDto, UpdateTemplateInput

_ALLOWED_TAGS = {"p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "span", "div"}
# "rel" is deliberately absent here — nh3 auto-adds rel="noopener noreferrer"
# to every <a> itself (its link_rel param, on by default). Also listing "rel"
# in the allowlist hits an nh3/ammonia panic: "if rel is in the generic or
# tag attributes, link_rel must be set to None" (nh3.clean's own docstring) —
# this was silently 500-ing every template save that reached sanitization.
_ALLOWED_ATTRIBUTES = {"a": {"href", "target"}}
_INTERPOLATE_PATTERN = re.compile(r"{{\s*(\w+)\s*}}")


def _to_dto(doc: Template) -> TemplateDto:
    return TemplateDto(
        id=str(doc.id),
        userId=str(doc.userId),
        name=doc.name,
        subject=doc.subject,
        body=doc.body,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _sanitize_body(body: str) -> str:
    return nh3.clean(body, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRIBUTES)


def interpolate(text: str, values: dict[str, str]) -> str:
    """Unknown or missing variables are left blank rather than raising —
    templates must still render for contacts with partial data."""
    return _INTERPOLATE_PATTERN.sub(lambda m: values.get(m.group(1), ""), text)


async def list_templates(user_id: ObjectId) -> list[TemplateDto]:
    docs = await template_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def get_by_id(template_id: ObjectId, user_id: ObjectId) -> TemplateDto:
    doc = await template_repository.find_by_id(template_id, user_id)
    if not doc:
        raise NotFoundError("Template not found")
    return _to_dto(doc)


async def create(user_id: ObjectId, input_: CreateTemplateInput) -> TemplateDto:
    doc = await template_repository.create(user_id, name=input_.name, subject=input_.subject, body=_sanitize_body(input_.body))
    return _to_dto(doc)


async def update(template_id: ObjectId, user_id: ObjectId, input_: UpdateTemplateInput) -> TemplateDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    if updates.get("body"):
        updates["body"] = _sanitize_body(updates["body"])
    doc = await template_repository.update(template_id, user_id, updates)
    if not doc:
        raise NotFoundError("Template not found")
    return _to_dto(doc)


async def delete(template_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await template_repository.delete(template_id, user_id)
    if not deleted:
        raise NotFoundError("Template not found")


async def duplicate(template_id: ObjectId, user_id: ObjectId) -> TemplateDto:
    original = await template_repository.find_by_id(template_id, user_id)
    if not original:
        raise NotFoundError("Template not found")
    copy = await template_repository.create(user_id, name=f"{original.name} (copy)", subject=original.subject, body=original.body)
    return _to_dto(copy)


def preview(subject: str, body: str, values: dict[str, str]) -> tuple[str, str]:
    return interpolate(subject, values), interpolate(body, values)
