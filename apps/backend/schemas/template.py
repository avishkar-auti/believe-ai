"""API-facing shapes for templates — mirrors packages/shared's Template type
and template.schema.ts's Zod schemas. See models/template.py for the
persisted Beanie Document this is derived from."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TemplateDto(BaseModel):
    id: str
    userId: str
    name: str
    subject: str
    body: str
    createdAt: str
    updatedAt: str


class CreateTemplateInput(BaseModel):
    name: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)


class UpdateTemplateInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    subject: str | None = Field(default=None, min_length=1)
    body: str | None = Field(default=None, min_length=1)


class TemplatePreviewInput(BaseModel):
    subject: str
    body: str
    values: dict[str, str] = Field(default_factory=dict)


class TemplatePreviewResult(BaseModel):
    subject: str
    body: str
