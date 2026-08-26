"""Beanie-backed access to the shared idea-board — mirrors apps/api's
roomIdea.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.room_idea import RoomIdea


async def create(room_id: ObjectId, question_id: str, author_user_id: ObjectId, author_name: str, text: str) -> RoomIdea:
    doc = RoomIdea(roomId=room_id, questionId=question_id, authorUserId=author_user_id, authorName=author_name, text=text)
    await doc.insert()
    return doc


async def list_by_room(room_id: ObjectId, question_id: str | None = None) -> list[RoomIdea]:
    query = RoomIdea.find(RoomIdea.roomId == room_id)
    if question_id:
        query = query.find(RoomIdea.questionId == question_id)
    return await query.sort("+createdAt").to_list()
