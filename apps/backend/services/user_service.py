"""The caller's own profile — mirrors apps/api's user.service.ts's
getById/updateProfile (findOrCreateByFirebaseUid now lives in
core/security.py's resolve_mongo_user_id, the one place a User is created)."""

from __future__ import annotations

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from core.errors import NotFoundError, ValidationError
from models.user import User
from repositories import user_repository
from schemas.user import UpdateProfileInput, UserDto, validate_username


def _to_dto(doc: User) -> UserDto:
    assert doc.id is not None
    return UserDto(
        id=str(doc.id),
        firebaseUid=doc.firebaseUid,
        email=doc.email,
        name=doc.name,
        avatar=doc.avatar,
        company=doc.company,
        jobTitle=doc.jobTitle,
        timezone=doc.timezone,
        role=doc.role,
        plan=doc.plan,
        onboardingCompleted=doc.onboardingCompleted,
        username=doc.username,
        headline=doc.headline,
        bio=doc.bio,
        socialLinks=doc.socialLinks,
        publicProfileEnabled=doc.publicProfileEnabled,
        cardTheme=doc.cardTheme,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


async def get_by_id(user_id: ObjectId) -> UserDto:
    user = await user_repository.find_by_id(user_id)
    if not user:
        raise NotFoundError("User not found")
    return _to_dto(user)


async def check_username_available(user_id: ObjectId, username: str) -> bool:
    try:
        cleaned = validate_username(username)
    except ValueError:
        return False
    existing = await user_repository.find_by_username(cleaned)
    return existing is None or existing.id == user_id


async def update_profile(user_id: ObjectId, updates: UpdateProfileInput) -> UserDto:
    fields = updates.model_dump(exclude_unset=True)

    if "username" in fields and fields["username"] is not None:
        if not await check_username_available(user_id, fields["username"]):
            raise ValidationError("That username is already taken.")

    try:
        user = await user_repository.update_profile(
            user_id,
            name=fields.get("name"),
            company=fields.get("company", ...),
            job_title=fields.get("jobTitle", ...),
            timezone=fields.get("timezone"),
            onboarding_completed=fields.get("onboardingCompleted"),
            role=fields.get("role"),
            username=fields.get("username", ...),
            headline=fields.get("headline", ...),
            bio=fields.get("bio", ...),
            social_links=fields.get("socialLinks"),
            public_profile_enabled=fields.get("publicProfileEnabled"),
            card_theme=fields.get("cardTheme"),
        )
    except DuplicateKeyError as err:
        # Backstop for a race between the availability check above and this
        # write — extremely unlikely, but a clean 400 beats a raw 500.
        raise ValidationError("That username is already taken.") from err

    if not user:
        raise NotFoundError("User not found")
    return _to_dto(user)
