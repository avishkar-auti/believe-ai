"""Mirrors packages/server/src/models/Template.model.ts — same "templates"
collection, same field shapes and indexes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

# "text" (default) is the legacy/plain format — normalized into HTML at
# render time (services/email_content.py). "html" is real HTML authored
# through the rich Write/HTML composer. Every template written before this
# field existed reads back as "text", so old records keep working exactly
# as before with zero migration.
TemplateBodyFormat = Literal["text", "html"]


class Template(Document):
    userId: PydanticObjectId
    name: str
    subject: str
    body: str
    bodyFormat: TemplateBodyFormat = "text"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "templates"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
