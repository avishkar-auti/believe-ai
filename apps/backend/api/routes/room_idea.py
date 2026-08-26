"""Mirrors apps/api's roomIdea.routes.ts, mounted at /mock-interview/{code}/ideas."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserNameDep
from schemas.room_idea import CreateIdeaInput, RoomIdeaDto
from services import room_idea_service

router = APIRouter(prefix="/mock-interview/{code}/ideas", tags=["room-ideas"])


@router.post("/", response_model=RoomIdeaDto, status_code=201)
async def create_idea_route(code: str, body: CreateIdeaInput, mongo_user_id: MongoUserIdDep, user_name: UserNameDep) -> RoomIdeaDto:
    return await room_idea_service.create(code, mongo_user_id, user_name, body.questionId, body.text)


@router.get("/", response_model=list[RoomIdeaDto])
async def list_ideas_route(code: str, _mongo_user_id: MongoUserIdDep, question_id: str | None = None) -> list[RoomIdeaDto]:
    return await room_idea_service.list_ideas(code, question_id)
