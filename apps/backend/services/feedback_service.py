"""User-submitted feedback — mirrors apps/api's feedback.service.ts."""

from __future__ import annotations

from bson import ObjectId

from models.feedback import Feedback
from repositories import feedback_repository
from schemas.feedback import FeedbackDto


def _to_dto(doc: Feedback) -> FeedbackDto:
    assert doc.id is not None
    return FeedbackDto(
        id=str(doc.id),
        userId=str(doc.userId) if doc.userId else None,
        message=doc.message,
        page=doc.page,
        status=doc.status,
        createdAt=doc.createdAt.isoformat(),
    )


async def submit(user_id: ObjectId | None, message: str, page: str | None) -> FeedbackDto:
    doc = await feedback_repository.create(user_id, message, page)
    return _to_dto(doc)
