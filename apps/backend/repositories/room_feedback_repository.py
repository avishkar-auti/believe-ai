"""Beanie-backed access to peer feedback — mirrors apps/api's
roomFeedback.repository.ts, including its upsert-on-resubmit semantics."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.room_feedback import RoomFeedback


async def upsert(
    room_id: ObjectId,
    question_id: str,
    turn_speaker_user_id: ObjectId,
    rater_user_id: ObjectId,
    rater_name: str,
    rating: int,
    comment: str | None,
) -> RoomFeedback:
    """Upserts on the (room, question, speaker, rater) compound key — a rater
    resubmitting for the same turn updates their existing rating in place."""
    existing = await RoomFeedback.find_one(
        RoomFeedback.roomId == room_id,
        RoomFeedback.questionId == question_id,
        RoomFeedback.turnSpeakerUserId == turn_speaker_user_id,
        RoomFeedback.raterUserId == rater_user_id,
    )
    if existing:
        existing.raterName = rater_name
        existing.rating = rating
        existing.comment = comment
        existing.updatedAt = datetime.now(UTC)
        await existing.save()
        return existing

    doc = RoomFeedback(
        roomId=room_id,
        questionId=question_id,
        turnSpeakerUserId=turn_speaker_user_id,
        raterUserId=rater_user_id,
        raterName=rater_name,
        rating=rating,
        comment=comment,
    )
    await doc.insert()
    return doc


async def summary_by_room(room_id: ObjectId) -> list[dict]:
    """Average rating + count per speaker across the whole room session."""
    return await RoomFeedback.aggregate(
        [
            {"$match": {"roomId": room_id}},
            {"$group": {"_id": "$turnSpeakerUserId", "averageRating": {"$avg": "$rating"}, "ratingCount": {"$sum": 1}}},
        ]
    ).to_list()


async def summary_for_speaker(room_id: ObjectId, speaker_user_id: ObjectId) -> dict | None:
    """Same aggregate scoped to one speaker — used to broadcast a fresh badge
    value right after a submission without a client round-trip."""
    rows = await RoomFeedback.aggregate(
        [
            {"$match": {"roomId": room_id, "turnSpeakerUserId": speaker_user_id}},
            {"$group": {"_id": None, "averageRating": {"$avg": "$rating"}, "ratingCount": {"$sum": 1}}},
        ]
    ).to_list()
    return rows[0] if rows else None
