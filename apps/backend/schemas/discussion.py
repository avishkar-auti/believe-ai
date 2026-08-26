"""API-facing shapes for discussions — mirrors packages/shared's Discussion
type and discussion.schema.ts's Zod schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DiscussionReplyDto(BaseModel):
    id: str
    authorId: str
    authorName: str
    body: str
    createdAt: str


class DiscussionDto(BaseModel):
    id: str
    authorId: str
    authorName: str
    title: str
    body: str
    replies: list[DiscussionReplyDto]
    upvoteCount: int
    upvotedByMe: bool | None = None
    createdAt: str
    updatedAt: str


class CreateDiscussionInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)


class CreateReplyInput(BaseModel):
    body: str = Field(min_length=1)
