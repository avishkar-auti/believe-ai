"""Beanie-backed access to user-submitted feedback — mirrors apps/api's
feedback.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.feedback import Feedback


async def create(user_id: ObjectId | None, message: str, page: str | None) -> Feedback:
    doc = Feedback(userId=user_id, message=message, page=page)
    await doc.insert()
    return doc
