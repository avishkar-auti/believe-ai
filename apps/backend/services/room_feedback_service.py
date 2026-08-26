"""Peer feedback CRUD — mirrors apps/api's roomFeedback.service.ts."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError, ValidationError
from models.room_feedback import RoomFeedback
from repositories import mock_interview_room_repository, room_feedback_repository
from schemas.room_feedback import RoomFeedbackDto, RoomFeedbackSummaryEntry, SubmitRoomFeedbackInput
from ws.mock_interview import broadcast_to_room


def _to_dto(doc: RoomFeedback) -> RoomFeedbackDto:
    assert doc.id is not None
    return RoomFeedbackDto(
        id=str(doc.id),
        roomId=str(doc.roomId),
        questionId=doc.questionId,
        turnSpeakerUserId=str(doc.turnSpeakerUserId),
        raterUserId=str(doc.raterUserId),
        raterName=doc.raterName,
        rating=doc.rating,
        comment=doc.comment,
        createdAt=doc.createdAt.isoformat(),
    )


def _round_to_one_decimal(value: float) -> float:
    return round(value * 10) / 10


async def submit(code: str, rater_user_id: ObjectId, rater_name: str, input_: SubmitRoomFeedbackInput) -> RoomFeedbackDto:
    """Upserts the rating, then broadcasts the speaker's refreshed average
    over the room's WS connection so every roster badge updates live —
    same one-update-path pattern as ideas and questions."""
    if input_.turnSpeakerUserId == str(rater_user_id):
        raise ValidationError("You can't rate your own turn")

    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        raise NotFoundError("Room not found")
    assert room.id is not None

    turn_speaker_user_id = ObjectId(input_.turnSpeakerUserId)
    doc = await room_feedback_repository.upsert(
        room.id, input_.questionId, turn_speaker_user_id, rater_user_id, rater_name, input_.rating, input_.comment
    )

    dto = _to_dto(doc)
    speaker_summary = await room_feedback_repository.summary_for_speaker(room.id, turn_speaker_user_id)
    await broadcast_to_room(
        code,
        {
            "type": "feedback-summary-updated",
            "speakerUserId": input_.turnSpeakerUserId,
            "averageRating": _round_to_one_decimal(speaker_summary["averageRating"]) if speaker_summary else None,
            "ratingCount": speaker_summary["ratingCount"] if speaker_summary else 0,
        },
    )
    return dto


async def summary(code: str) -> list[RoomFeedbackSummaryEntry]:
    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        raise NotFoundError("Room not found")
    assert room.id is not None

    rows = await room_feedback_repository.summary_by_room(room.id)
    return [
        RoomFeedbackSummaryEntry(
            speakerUserId=str(r["_id"]), averageRating=_round_to_one_decimal(r["averageRating"]), ratingCount=r["ratingCount"]
        )
        for r in rows
    ]
