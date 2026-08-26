"""Mirrors packages/server/src/models/Discussion.model.ts — same
"discussions" collection, same field shapes. Replies are embedded
subdocuments, each with its own PydanticObjectId (Mongoose auto-generates
one per array subdocument by default; Beanie doesn't, so it's given one
explicitly here)."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class DiscussionReply(BaseModel):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId)
    authorId: PydanticObjectId
    authorName: str
    body: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Discussion(Document):
    authorId: PydanticObjectId
    authorName: str
    title: str
    body: str
    replies: list[DiscussionReply] = Field(default_factory=list)
    # Who upvoted, not just a count — makes "toggle" and "did I already upvote" trivial.
    upvotes: list[PydanticObjectId] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "discussions"
        indexes = [IndexModel([("createdAt", -1)])]
