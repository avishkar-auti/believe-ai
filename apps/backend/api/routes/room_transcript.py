"""Mirrors apps/api's roomTranscript.routes.ts, mounted at /mock-interview/{code}/transcript."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserNameDep
from schemas.room_transcript import AppendTranscriptChunkInput
from services import room_transcript_service

router = APIRouter(prefix="/mock-interview/{code}/transcript", tags=["room-transcript"])


@router.post("/", status_code=201)
async def append_transcript_route(
    code: str, body: AppendTranscriptChunkInput, mongo_user_id: MongoUserIdDep, user_name: UserNameDep
) -> dict[str, bool]:
    await room_transcript_service.append(code, mongo_user_id, user_name, body)
    return {"ok": True}
