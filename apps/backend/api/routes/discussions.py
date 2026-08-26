"""Mirrors apps/api's discussion.routes.ts route shapes exactly."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from schemas.discussion import CreateDiscussionInput, CreateReplyInput, DiscussionDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import discussion_service

router = APIRouter(prefix="/discussions", tags=["discussions"])


@router.get("/", response_model=PaginatedResult[DiscussionDto])
async def list_discussions_route(
    mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[DiscussionDto]:
    return await discussion_service.list_discussions(mongo_user_id, page, limit)


@router.post("/", response_model=DiscussionDto, status_code=201)
async def create_discussion_route(body: CreateDiscussionInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> DiscussionDto:
    return await discussion_service.create(mongo_user_id, body)


@router.get("/{discussion_id}", response_model=DiscussionDto)
async def get_discussion_route(discussion_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> DiscussionDto:
    return await discussion_service.get_by_id(discussion_id, mongo_user_id)


@router.post("/{discussion_id}/replies", response_model=DiscussionDto, status_code=201)
async def add_reply_route(
    discussion_id: PydanticObjectId, body: CreateReplyInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> DiscussionDto:
    return await discussion_service.add_reply(discussion_id, mongo_user_id, body.body)


@router.post("/{discussion_id}/upvote", response_model=DiscussionDto)
async def toggle_upvote_route(discussion_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> DiscussionDto:
    return await discussion_service.toggle_upvote(discussion_id, mongo_user_id)


@router.delete("/{discussion_id}")
async def delete_discussion_route(
    discussion_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, Literal[True]]:
    await discussion_service.delete(discussion_id, mongo_user_id)
    return {"deleted": True}
