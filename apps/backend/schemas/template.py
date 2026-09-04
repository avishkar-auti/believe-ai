"""API-facing shapes for templates — mirrors packages/shared's Template type
and template.schema.ts's Zod schemas. See models/template.py for the
persisted Beanie Document this is derived from."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.template import TemplateBodyFormat


class TemplateDto(BaseModel):
    id: str
    userId: str
    name: str
    subject: str
    body: str
    bodyFormat: TemplateBodyFormat
    # Always-rendered representations — the composer's Preview mode, the
    # templates list card, and anything else that just needs to *show* the
    # body use these instead of re-deriving them from `body`/`bodyFormat`
    # themselves. See services/email_content.py.
    bodyHtml: str
    bodyText: str
    createdAt: str
    updatedAt: str


class CreateTemplateInput(BaseModel):
    name: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)
    bodyFormat: TemplateBodyFormat = "text"


class UpdateTemplateInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    subject: str | None = Field(default=None, min_length=1)
    body: str | None = Field(default=None, min_length=1)
    bodyFormat: TemplateBodyFormat | None = None


class TemplatePreviewInput(BaseModel):
    subject: str
    body: str
    bodyFormat: TemplateBodyFormat = "text"
    values: dict[str, str] = Field(default_factory=dict)


class TemplatePreviewResult(BaseModel):
    subject: str
    # Always real, rendered HTML — safe to render directly (dangerouslySetInnerHTML
    # on the frontend), regardless of the source template's bodyFormat.
    body: str
