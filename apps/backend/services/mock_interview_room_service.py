"""Live Practice Room CRUD — mirrors apps/api's mockInterviewRoom.service.ts.
Question/recap/summary *generation* already lives in this process
(services/room_question_service.py etc, called by api/routes/room.py); this
is the Mongo orchestration layer that used to sit in front of them over
HTTP. Now that both halves run in-process, broadcasting to a live room is a
direct call into ws/mock_interview.py instead of an internal HTTP request.
"""

from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.mock_interview_room import MockInterviewRoom, RoomQuestion
from repositories import mock_interview_room_repository
from schemas.mock_interview_room import (
    IceServerDto,
    MockInterviewRoomDto,
    RoomLiveRecapDto,
    RoomParticipantDto,
    RoomPerStudentNoteDto,
    RoomQuestionDto,
    RoomSummaryDto,
    ScheduleRoomInput,
)
from services.room_question_service import generate_questions_for_room
from services.room_recap_service import build_recap_for_room
from utils.mongo_datetime import as_aware_utc
from utils.room_joinable import is_room_joinable
from worker.client import get_worker_pool
from ws.mock_interview import broadcast_to_room

REMINDER_LEAD_MINUTES = 10
# Skip the Python call and return the cached recap if it's fresher than this —
# multiple tabs polling independently shouldn't multiply LLM calls.
RECAP_THROTTLE_SECONDS = 30

# Seeded when a host doesn't (yet) have AI-generated questions for a room.
_DEFAULT_QUESTIONS = [
    "Walk us through a project you're proud of, and what made it hard.",
    "Tell me about a time you disagreed with a teammate. How did you handle it?",
    "What's a technical concept you had to teach yourself recently?",
    "Describe a mistake you made and what you'd do differently now.",
    "How do you prioritize when everything feels urgent?",
    "What's a piece of feedback that changed how you work?",
    "Tell me about a time you had to learn something under time pressure.",
    "What does a good day at work look like for you?",
]


def _seed_questions() -> list[RoomQuestion]:
    return [RoomQuestion(id=str(uuid.uuid4()), text=text, source="manual", order=i) for i, text in enumerate(_DEFAULT_QUESTIONS)]


def _to_dto(doc: MockInterviewRoom) -> MockInterviewRoomDto:
    assert doc.id is not None
    scheduled_at = doc.scheduledAt.isoformat()
    return MockInterviewRoomDto(
        id=str(doc.id),
        code=doc.code,
        hostUserId=str(doc.hostUserId),
        hostName=doc.hostName,
        inviteEmails=doc.inviteEmails,
        topic=doc.topic,
        targetRole=doc.targetRole,
        scheduledAt=scheduled_at,
        durationMinutes=doc.durationMinutes,
        minParticipants=doc.minParticipants,
        maxParticipants=doc.maxParticipants,
        status=doc.status,
        participants=[
            RoomParticipantDto(
                userId=str(p.userId), name=p.name, joinedAt=p.joinedAt.isoformat(), leftAt=p.leftAt.isoformat() if p.leftAt else None
            )
            for p in doc.participants
        ],
        questions=[RoomQuestionDto(id=q.id, text=q.text, source=q.source, order=q.order) for q in doc.questions],
        currentQuestionIndex=doc.currentQuestionIndex,
        currentSpeakerUserId=str(doc.currentSpeakerUserId) if doc.currentSpeakerUserId else None,
        turnStartedAt=doc.turnStartedAt.isoformat() if doc.turnStartedAt else None,
        liveRecap=RoomLiveRecapDto(text=doc.liveRecap.text, updatedAt=doc.liveRecap.updatedAt.isoformat()) if doc.liveRecap else None,
        summary=(
            RoomSummaryDto(
                groupSummary=doc.summary.groupSummary,
                perStudent=[
                    RoomPerStudentNoteDto(
                        userId=str(s.userId), name=s.name, strength=s.strength, growthArea=s.growthArea, averageRating=s.averageRating
                    )
                    for s in doc.summary.perStudent
                ],
                generatedAt=doc.summary.generatedAt.isoformat(),
            )
            if doc.summary
            else None
        ),
        joinable=doc.status == "scheduled" and is_room_joinable(doc.scheduledAt, doc.durationMinutes),
        createdAt=doc.createdAt.isoformat(),
    )


async def _generate_unique_code() -> str:
    for _ in range(5):
        code = secrets.token_hex(4)
        if not await mock_interview_room_repository.find_by_code(code):
            return code
    raise ValidationError("Could not generate a unique room code — try again")


async def schedule(host_user_id: ObjectId, host_name: str, input_: ScheduleRoomInput) -> MockInterviewRoomDto:
    scheduled_at = input_.scheduledAt if input_.scheduledAt.tzinfo else input_.scheduledAt.replace(tzinfo=UTC)
    if scheduled_at <= datetime.now(UTC):
        raise ValidationError("scheduledAt must be in the future")

    code = await _generate_unique_code()
    doc = await mock_interview_room_repository.create(
        MockInterviewRoom(
            code=code,
            hostUserId=host_user_id,
            hostName=host_name,
            inviteEmails=input_.inviteEmails,
            topic=input_.topic,
            targetRole=input_.targetRole,
            scheduledAt=scheduled_at,
            durationMinutes=input_.durationMinutes,
            minParticipants=input_.targetSize,
            maxParticipants=input_.targetSize,
            questions=_seed_questions(),
        )
    )
    assert doc.id is not None

    pool = await get_worker_pool()
    for guest_email in doc.inviteEmails:
        base = {
            "room_id": str(doc.id),
            "host_user_id": str(host_user_id),
            "host_name": host_name,
            "guest_email": guest_email,
            "room_code": doc.code,
            "scheduled_at": scheduled_at.isoformat(),
            "duration_minutes": doc.durationMinutes,
        }
        await pool.enqueue_job("send_meeting_email", {**base, "kind": "invite"})

        reminder_at = scheduled_at - timedelta(minutes=REMINDER_LEAD_MINUTES)
        delay_seconds = (reminder_at - datetime.now(UTC)).total_seconds()
        # Only queue the reminder if it would actually fire before the meeting starts —
        # a room booked less than 10 minutes out shouldn't get a "starting soon" email after it's over.
        if delay_seconds > 0:
            await pool.enqueue_job("send_meeting_email", {**base, "kind": "reminder"}, _defer_by=delay_seconds)

    return _to_dto(doc)


async def list_mine(host_user_id: ObjectId) -> list[MockInterviewRoomDto]:
    docs = await mock_interview_room_repository.list_by_host(host_user_id)
    return [_to_dto(doc) for doc in docs]


async def get_by_code(code: str) -> MockInterviewRoomDto:
    doc = await mock_interview_room_repository.find_by_code(code)
    if not doc:
        raise NotFoundError("Room not found")
    return _to_dto(doc)


async def cancel(room_id: ObjectId, host_user_id: ObjectId) -> None:
    doc = await mock_interview_room_repository.cancel(room_id, host_user_id)
    if not doc:
        raise NotFoundError("Room not found")


async def end_room(code: str, host_user_id: ObjectId) -> None:
    """Marks the room completed and enqueues the summary job rather than
    generating it synchronously — ending shouldn't block on an LLM call or
    fail if the host's tab closes right after. Broadcasts room-ended so
    every connected tab navigates to the summary view immediately."""
    doc = await mock_interview_room_repository.end_by_host(code, host_user_id)
    if not doc:
        raise NotFoundError("Room not found")
    assert doc.id is not None

    pool = await get_worker_pool()
    await pool.enqueue_job("generate_room_summary", str(doc.id))
    await broadcast_to_room(code, {"type": "room-ended"})


async def get_summary(code: str) -> RoomSummaryDto | None:
    doc = await mock_interview_room_repository.find_by_code(code)
    if not doc:
        raise NotFoundError("Room not found")
    return _to_dto(doc).summary


async def regenerate_questions(
    settings: Settings, db: AsyncIOMotorDatabase, room_id: ObjectId, host_user_id: ObjectId
) -> MockInterviewRoomDto:
    """Host-only — set_questions is scoped to {_id, hostUserId} so a
    non-host caller simply gets "Room not found" rather than a leaked 403
    revealing the room exists. Broadcasts the refreshed list over the
    room's WS connection so every already-joined tab updates without a
    refresh."""
    result = await generate_questions_for_room(settings, db, room_id)
    mapped = [RoomQuestion(id=str(uuid.uuid4()), text=text, source="ai", order=i) for i, text in enumerate(result.questions)]

    doc = await mock_interview_room_repository.set_questions(room_id, host_user_id, mapped)
    if not doc:
        raise NotFoundError("Room not found")

    await broadcast_to_room(doc.code, {"type": "questions-updated", "questions": [q.model_dump() for q in mapped]})
    return _to_dto(doc)


async def get_recap(settings: Settings, db: AsyncIOMotorDatabase, code: str) -> RoomLiveRecapDto:
    """Throttled independently of whatever poll interval the frontend uses —
    returns the cached recap if it's fresh enough, otherwise generates a
    fresh one and persists it before returning."""
    doc = await mock_interview_room_repository.find_by_code(code)
    if not doc:
        raise NotFoundError("Room not found")
    assert doc.id is not None

    if doc.liveRecap and (datetime.now(UTC) - as_aware_utc(doc.liveRecap.updatedAt)).total_seconds() < RECAP_THROTTLE_SECONDS:
        return RoomLiveRecapDto(text=doc.liveRecap.text, updatedAt=doc.liveRecap.updatedAt.isoformat())

    result = await build_recap_for_room(settings, db, doc.id)
    updated_at = datetime.now(UTC)
    updated = await mock_interview_room_repository.update_live_recap(code, result.recap, updated_at)
    if not updated or not updated.liveRecap:
        raise NotFoundError("Room not found")
    return RoomLiveRecapDto(text=updated.liveRecap.text, updatedAt=updated.liveRecap.updatedAt.isoformat())


def get_ice_servers(settings: Settings) -> list[IceServerDto]:
    """Served per-session rather than bundled into the client — TURN
    credentials are a real secret, not something to ship in a JS bundle. A
    public STUN server is always included so calls work without any
    config; TURN is added only when configured, for networks that block
    direct peer-to-peer connections."""
    servers = [IceServerDto(urls="stun:stun.l.google.com:19302")]
    if settings.turn_urls and settings.turn_username and settings.turn_credential:
        servers.append(
            IceServerDto(
                urls=[u.strip() for u in settings.turn_urls.split(",")],
                username=settings.turn_username,
                credential=settings.turn_credential,
            )
        )
    return servers
