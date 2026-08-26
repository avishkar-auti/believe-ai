"""Design Studio v1 — one DesignScreen per generated/edited screen. The dsl
field holds a DesignNode tree (see prompts/design.py for the vocabulary);
it's stored as a plain dict since the frontend renderer, not a rigid
backend schema, is the source of truth for interpreting node shapes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class DesignScreenPosition(BaseModel):
    x: float = 0
    y: float = 0


class DesignScreen(Document):
    userId: PydanticObjectId
    # Optional so pre-existing legacy docs (created before projects existed)
    # still deserialize cleanly — they simply become invisible to every
    # project-scoped query rather than a hard migration.
    projectId: PydanticObjectId | None = None
    title: str
    prompt: str
    platform: Literal["web", "mobile"]
    dsl: dict[str, Any]
    canvasPosition: DesignScreenPosition = Field(default_factory=DesignScreenPosition)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "designscreens"
        indexes = [
            IndexModel([("userId", 1), ("projectId", 1)]),
        ]
