"""Beanie-backed write access to the caller's own profile — mirrors apps/api's
user.repository.ts's findById/updateProfile. find_by_firebase_uid stays in
repositories/users_repository.py (raw Motor, read-only) since core/security.py
needs it before Beanie is guaranteed initialized on a cold path; this module
is for the authenticated, Beanie-backed profile routes."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.user import CardTheme, User


async def find_by_id(user_id: ObjectId) -> User | None:
    return await User.get(user_id)


async def find_by_username(username: str) -> User | None:
    return await User.find_one(User.username == username)


async def update_profile(
    user_id: ObjectId,
    *,
    name: str | None = None,
    company: str | None = ...,  # type: ignore[assignment]
    job_title: str | None = ...,  # type: ignore[assignment]
    timezone: str | None = None,
    onboarding_completed: bool | None = None,
    role: str | None = None,
    username: str | None = ...,  # type: ignore[assignment]
    headline: str | None = ...,  # type: ignore[assignment]
    bio: str | None = ...,  # type: ignore[assignment]
    social_links: dict[str, str] | None = None,
    public_profile_enabled: bool | None = None,
    card_theme: CardTheme | None = None,
) -> User | None:
    """Only fields the caller actually supplied are touched — nullable string
    fields use `...` as their "not supplied" sentinel since `None` is itself a
    valid value to set (clearing the field), same distinction Node's
    Partial<> + zod .nullable().optional() makes."""
    user = await User.get(user_id)
    if not user:
        return None
    if name is not None:
        user.name = name
    if company is not ...:
        user.company = company
    if job_title is not ...:
        user.jobTitle = job_title
    if timezone is not None:
        user.timezone = timezone
    if onboarding_completed is not None:
        user.onboardingCompleted = onboarding_completed
    if role is not None:
        user.role = role  # type: ignore[assignment]
    if username is not ...:
        user.username = username
    if headline is not ...:
        user.headline = headline
    if bio is not ...:
        user.bio = bio
    if social_links is not None:
        user.socialLinks = social_links
    if public_profile_enabled is not None:
        user.publicProfileEnabled = public_profile_enabled
    if card_theme is not None:
        user.cardTheme = card_theme
    user.updatedAt = datetime.now(UTC)
    await user.save()
    return user
