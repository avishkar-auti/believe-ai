"""Beanie-backed access for avatar/cover image bytes — see
models/profile_image.py for why this stores raw bytes rather than a URL to
external object storage."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.profile_image import ProfileImage, ProfileImageKind


async def find(user_id: ObjectId, kind: ProfileImageKind) -> ProfileImage | None:
    return await ProfileImage.find_one(ProfileImage.userId == user_id, ProfileImage.kind == kind)


async def upsert(user_id: ObjectId, kind: ProfileImageKind, data: bytes, content_type: str) -> ProfileImage:
    doc = await find(user_id, kind)
    if doc:
        doc.data = data
        doc.contentType = content_type
        doc.updatedAt = datetime.now(UTC)
        await doc.save()
        return doc
    doc = ProfileImage(userId=user_id, kind=kind, data=data, contentType=content_type)
    await doc.insert()
    return doc


async def delete(user_id: ObjectId, kind: ProfileImageKind) -> bool:
    doc = await find(user_id, kind)
    if not doc:
        return False
    await doc.delete()
    return True
