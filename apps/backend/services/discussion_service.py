"""Discussions (Community threads) — mirrors apps/api's discussion.service.ts."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from models.discussion import Discussion
from models.user import User
from repositories import discussion_repository
from schemas.discussion import CreateDiscussionInput, DiscussionDto, DiscussionReplyDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages


def _to_dto(doc: Discussion, viewer_id: ObjectId) -> DiscussionDto:
    return DiscussionDto(
        id=str(doc.id),
        authorId=str(doc.authorId),
        authorName=doc.authorName,
        title=doc.title,
        body=doc.body,
        replies=[
            DiscussionReplyDto(
                id=str(r.id), authorId=str(r.authorId), authorName=r.authorName, body=r.body, createdAt=r.createdAt.isoformat()
            )
            for r in doc.replies
        ],
        upvoteCount=len(doc.upvotes),
        upvotedByMe=viewer_id in doc.upvotes,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


async def _display_name(user_id: ObjectId) -> str:
    """Mirrors Node's auth middleware setting req.userName = user.name || user.email."""
    user = await User.get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return user.name or user.email


async def list_discussions(viewer_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE) -> PaginatedResult[DiscussionDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    items, total = await discussion_repository.list_discussions(safe_page_, safe_limit_)
    return PaginatedResult[DiscussionDto](
        items=[_to_dto(doc, viewer_id) for doc in items],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )


async def get_by_id(discussion_id: ObjectId, viewer_id: ObjectId) -> DiscussionDto:
    doc = await discussion_repository.find_by_id(discussion_id)
    if not doc:
        raise NotFoundError("Discussion not found")
    return _to_dto(doc, viewer_id)


async def create(author_id: ObjectId, input_: CreateDiscussionInput) -> DiscussionDto:
    author_name = await _display_name(author_id)
    doc = await discussion_repository.create(author_id, author_name, input_.title, input_.body)
    return _to_dto(doc, author_id)


async def add_reply(discussion_id: ObjectId, author_id: ObjectId, body: str) -> DiscussionDto:
    author_name = await _display_name(author_id)
    doc = await discussion_repository.add_reply(discussion_id, author_id, author_name, body)
    if not doc:
        raise NotFoundError("Discussion not found")
    return _to_dto(doc, author_id)


async def toggle_upvote(discussion_id: ObjectId, user_id: ObjectId) -> DiscussionDto:
    doc = await discussion_repository.toggle_upvote(discussion_id, user_id)
    if not doc:
        raise NotFoundError("Discussion not found")
    return _to_dto(doc, user_id)


async def delete(discussion_id: ObjectId, author_id: ObjectId) -> None:
    deleted = await discussion_repository.delete(discussion_id, author_id)
    if not deleted:
        raise NotFoundError("Discussion not found")
