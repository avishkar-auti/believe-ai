"""Templates — mirrors apps/api's template.service.ts, including HTML
sanitization on write (templates and AI output are untrusted content) and
{{variable}} interpolation for preview."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.template import Template, TemplateBodyFormat
from repositories import template_repository
from schemas.template import CreateTemplateInput, TemplateDto, UpdateTemplateInput
from services.email_content import interpolate_html, to_html, to_plain_text
from services.personalization import LINK_KEYS, VARIABLE_PATTERN, canonical_key


def _to_dto(doc: Template) -> TemplateDto:
    rendered_html = to_html(doc.body, doc.bodyFormat)
    return TemplateDto(
        id=str(doc.id),
        userId=str(doc.userId),
        name=doc.name,
        subject=doc.subject,
        body=doc.body,
        bodyFormat=doc.bodyFormat,
        bodyHtml=rendered_html,
        bodyText=to_plain_text(rendered_html),
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def interpolate(text: str, values: dict[str, str]) -> str:
    """Plain (non-HTML-escaping) {{variable}} substitution — used for the
    subject line, which is never HTML, and as the legacy text-body path.
    Unknown or missing variables are left blank rather than raising —
    templates must still render for contacts with partial data.

    Names are folded through the registry's aliases first (see
    services/personalization.py), so {{sender_name}} and {{senderName}}
    resolve to the same profile field."""
    return VARIABLE_PATTERN.sub(lambda m: values.get(canonical_key(m.group(1)), ""), text)


async def list_templates(user_id: ObjectId) -> list[TemplateDto]:
    docs = await template_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def get_by_id(template_id: ObjectId, user_id: ObjectId) -> TemplateDto:
    doc = await template_repository.find_by_id(template_id, user_id)
    if not doc:
        raise NotFoundError("Template not found")
    return _to_dto(doc)


async def create(user_id: ObjectId, input_: CreateTemplateInput) -> TemplateDto:
    body = to_html(input_.body, input_.bodyFormat) if input_.bodyFormat == "html" else input_.body
    doc = await template_repository.create(user_id, name=input_.name, subject=input_.subject, body=body, body_format=input_.bodyFormat)
    return _to_dto(doc)


async def update(template_id: ObjectId, user_id: ObjectId, input_: UpdateTemplateInput) -> TemplateDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    if updates.get("body") is not None:
        existing = await template_repository.find_by_id(template_id, user_id)
        if not existing:
            raise NotFoundError("Template not found")
        body_format = updates.get("bodyFormat", existing.bodyFormat)
        if body_format == "html":
            updates["body"] = to_html(updates["body"], "html")
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
    copy = await template_repository.create(
        user_id, name=f"{original.name} (copy)", subject=original.subject, body=original.body, body_format=original.bodyFormat
    )
    return _to_dto(copy)


def preview(subject: str, body: str, body_format: TemplateBodyFormat, values: dict[str, str]) -> tuple[str, str]:
    """Renders exactly what the real send pipeline renders — the composer's
    Preview mode and the campaign recipient preview both call this, so
    neither can show something different from what actually gets sent (see
    services/email_content.py's module docstring for why that mismatch used
    to be the whole bug).

    `values` must already be resolved: the route merges the caller's chosen
    preview recipient with sender values built server-side from their own
    profile, so a preview can neither show a stale sender name nor be told
    to render someone else's identity."""
    rendered_html = to_html(body, body_format)
    # LINK_KEYS carry real <a> markup built by personalization.py — the same
    # raw_keys the send job passes, so a sign-off previews as a live link
    # rather than escaped tag text.
    return interpolate(subject, values), interpolate_html(rendered_html, values, raw_keys=LINK_KEYS)
