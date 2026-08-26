"""Mirrors packages/server/src/models/Template.model.ts — same "templates"
collection, same field shapes and indexes."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class Template(Document):
    userId: PydanticObjectId
    name: str
    subject: str
    body: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "templates"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
