"""Avatar/cover upload — validates and stores the bytes (models/profile_image.py),
then points User.avatar/User.coverImage at the new public GET route so every
existing <img src> consumer (IdentityCard, HolographicIdentityCard,
PublicIdentityPage, ProfileHero) picks it up with zero changes.

The stored value is a *relative* path (`/public/avatar/<userId>`), not an
absolute URL — the backend has no configured public hostname. The frontend
resolves it the same way notesApi.ts's attachmentUrl() resolves attachment
links: prefixing apiClient's own baseURL at render time."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError, ValidationError
from models.profile_image import ProfileImage, ProfileImageKind
from repositories import profile_image_repository, user_repository
from schemas.user import UserDto
from services import user_service

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _validate(content_type: str, data: bytes) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError("Images must be PNG, JPEG, WebP, or GIF.")
    if len(data) > MAX_IMAGE_BYTES:
        raise ValidationError("Images must be 5MB or smaller.")
    if not data:
        raise ValidationError("The uploaded file is empty.")


async def upload(user_id: ObjectId, kind: ProfileImageKind, filename: str, content_type: str, data: bytes) -> UserDto:
    _ = filename  # not persisted — the GET route is served by (userId, kind), not by name
    _validate(content_type, data)
    await profile_image_repository.upsert(user_id, kind, data, content_type)

    url = f"/public/{kind}/{user_id}"
    if kind == "avatar":
        user = await user_repository.set_avatar(user_id, url)
    else:
        user = await user_repository.set_cover_image(user_id, url)
    if not user:
        raise NotFoundError("User not found")
    return await user_service.get_by_id(user_id)


async def remove(user_id: ObjectId, kind: ProfileImageKind) -> UserDto:
    await profile_image_repository.delete(user_id, kind)
    if kind == "avatar":
        user = await user_repository.set_avatar(user_id, None)
    else:
        user = await user_repository.set_cover_image(user_id, None)
    if not user:
        raise NotFoundError("User not found")
    return await user_service.get_by_id(user_id)


async def get_image(user_id: ObjectId, kind: ProfileImageKind) -> ProfileImage:
    doc = await profile_image_repository.find(user_id, kind)
    if not doc:
        raise NotFoundError(f"No {kind} image set")
    return doc
