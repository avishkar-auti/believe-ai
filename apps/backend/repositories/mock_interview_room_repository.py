"""Beanie-backed access to the mock interview room collection — mirrors
apps/api's mockInterviewRoom.repository.ts in full: the WebRTC signaling
server's writes (findByCode/addParticipant/markParticipantLeft/
updateTurnState) plus the REST CRUD (create/list/cancel/end/setQuestions/
updateLiveRecap) now that both live in this one process. See
repositories/rooms_repository.py for the separate read-only Motor access
the AI agents (questions/recap/summary) use."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import PydanticObjectId
from bson import ObjectId

from models.mock_interview_room import MockInterviewRoom, RoomLiveRecap, RoomParticipant, RoomQuestion, RoomSummary


async def create(doc: MockInterviewRoom) -> MockInterviewRoom:
    await doc.insert()
    return doc


async def find_by_code(code: str) -> MockInterviewRoom | None:
    return await MockInterviewRoom.find_one(MockInterviewRoom.code == code)


async def find_by_id(room_id: ObjectId) -> MockInterviewRoom | None:
    return await MockInterviewRoom.get(room_id)


async def list_by_host(host_user_id: ObjectId, limit: int = 100) -> list[MockInterviewRoom]:
    """Upcoming and past, most recent first — a host's own scheduling history."""
    return (
        await MockInterviewRoom.find(MockInterviewRoom.hostUserId == host_user_id)
        .sort("-scheduledAt")
        .limit(limit)
        .to_list()
    )


async def cancel(room_id: ObjectId, host_user_id: ObjectId) -> MockInterviewRoom | None:
    doc = await MockInterviewRoom.find_one(
        MockInterviewRoom.id == room_id, MockInterviewRoom.hostUserId == host_user_id, MockInterviewRoom.status == "scheduled"
    )
    if not doc:
        return None
    doc.status = "cancelled"
    await doc.save()
    return doc


async def end_by_host(code: str, host_user_id: ObjectId) -> MockInterviewRoom | None:
    doc = await MockInterviewRoom.find_one(
        MockInterviewRoom.code == code, MockInterviewRoom.hostUserId == host_user_id, MockInterviewRoom.status == "scheduled"
    )
    if not doc:
        return None
    doc.status = "completed"
    await doc.save()
    return doc


async def set_questions(room_id: ObjectId, host_user_id: ObjectId, questions: list[RoomQuestion]) -> MockInterviewRoom | None:
    doc = await MockInterviewRoom.find_one(MockInterviewRoom.id == room_id, MockInterviewRoom.hostUserId == host_user_id)
    if not doc:
        return None
    doc.questions = questions
    await doc.save()
    return doc


async def update_live_recap(code: str, text: str, updated_at: datetime) -> MockInterviewRoom | None:
    doc = await find_by_code(code)
    if not doc:
        return None
    doc.liveRecap = RoomLiveRecap(text=text, updatedAt=updated_at)
    await doc.save()
    return doc


async def update_summary(room_id: ObjectId, summary: RoomSummary) -> MockInterviewRoom | None:
    doc = await find_by_id(room_id)
    if not doc:
        return None
    doc.summary = summary
    await doc.save()
    return doc


async def add_participant(code: str, user_id: ObjectId, name: str, joined_at: datetime) -> MockInterviewRoom | None:
    """Reactivates an existing (possibly previously-left) roster entry for this
    user if one exists, otherwise appends a new one — keeps rejoining from
    duplicating the participants array."""
    doc = await find_by_code(code)
    if not doc:
        return None

    existing = next((p for p in doc.participants if p.userId == user_id), None)
    if existing:
        existing.joinedAt = joined_at
        existing.leftAt = None
        existing.name = name
    else:
        doc.participants.append(RoomParticipant(userId=PydanticObjectId(user_id), name=name, joinedAt=joined_at, leftAt=None))

    await doc.save()
    return doc


async def mark_participant_left(code: str, user_id: ObjectId) -> MockInterviewRoom | None:
    doc = await find_by_code(code)
    if not doc:
        return None
    participant = next((p for p in doc.participants if p.userId == user_id), None)
    if not participant:
        return doc
    participant.leftAt = datetime.now(UTC)
    await doc.save()
    return doc


async def update_turn_state(
    code: str, *, current_question_index: int, current_speaker_user_id: ObjectId | None, turn_started_at: datetime | None
) -> MockInterviewRoom | None:
    doc = await find_by_code(code)
    if not doc:
        return None
    doc.currentQuestionIndex = current_question_index
    doc.currentSpeakerUserId = current_speaker_user_id  # type: ignore[assignment]
    doc.turnStartedAt = turn_started_at
    await doc.save()
    return doc
