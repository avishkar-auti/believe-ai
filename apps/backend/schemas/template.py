"""API-facing shapes for templates — mirrors packages/shared's Template type
and template.schema.ts's Zod schemas. See models/template.py for the
persisted Beanie Document this is derived from."""

from __future__ import annotations

from typing import Literal

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
    # Recipient values only — whichever contact the caller picked to preview
    # against. Any sender keys sent here are discarded and re-derived from the
    # authenticated user's profile (see the /preview route), so a preview
    # always reflects the real profile and can't be told to render someone
    # else's identity.
    values: dict[str, str] = Field(default_factory=dict)


class TemplatePreviewResult(BaseModel):
    subject: str
    # Always real, rendered HTML — safe to render directly (dangerouslySetInnerHTML
    # on the frontend), regardless of the source template's bodyFormat.
    body: str


class PersonalizationVariableDto(BaseModel):
    """One entry of the merge-variable registry, already resolved against the
    caller's own profile — the composer's variable picker renders these
    directly instead of keeping its own list and its own idea of what's set."""

    key: str
    # The literal text to insert, e.g. "{{senderName}}" — the client never
    # rebuilds this itself, so brace/spacing conventions can't drift.
    token: str
    label: str
    group: Literal["recipient", "sender"]
    description: str
    required: bool
    # Sender variables: whether the profile actually has this filled in.
    # Recipient variables are always True — they resolve per contact at send
    # time, so there's nothing for the sender to configure.
    configured: bool
    # What this currently resolves to, for the picker's preview line. Only
    # populated for sender variables; None when nothing is set. Link
    # variables show their URL here rather than their <a> markup.
    currentValue: str | None


class PersonalizationContextDto(BaseModel):
    variables: list[PersonalizationVariableDto]
    # Every sender variable the profile can't currently fill. The composer
    # intersects this with what a given template actually uses before
    # warning — an unset {{phone}} only matters if the body mentions it.
    missingSenderKeys: list[str]
