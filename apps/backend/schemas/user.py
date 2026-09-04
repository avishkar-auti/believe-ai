"""API-facing shapes for the caller's own profile — mirrors packages/shared's
User type."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.user import CardTheme, PlanTier, UserRole

# Reserved so a username can never shadow a real app route (e.g. /u/settings
# would collide with a future public alias of /app/settings).
RESERVED_USERNAMES = frozenset(
    {
        "app",
        "api",
        "admin",
        "settings",
        "login",
        "signup",
        "auth",
        "u",
        "profile",
        "public",
        "help",
        "support",
        "about",
        "pricing",
        "www",
        "believe",
        "believeai",
    }
)

_USERNAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$")

# Keys the frontend is allowed to set on socialLinks — deliberately closed so
# a public profile's link block always renders a known, styled icon.
ALLOWED_SOCIAL_LINK_KEYS = frozenset({"linkedin", "github", "leetcode", "portfolio", "twitter", "kaggle", "medium"})


def validate_username(value: str) -> str:
    lowered = value.strip().lower()
    if not _USERNAME_RE.match(lowered):
        raise ValueError("Usernames are 3-30 characters: lowercase letters, numbers, and hyphens, no leading/trailing hyphen.")
    if lowered in RESERVED_USERNAMES:
        raise ValueError("That username is reserved.")
    return lowered


class UserDto(BaseModel):
    id: str
    firebaseUid: str
    email: str
    name: str
    avatar: str | None
    coverImage: str | None
    company: str | None
    jobTitle: str | None
    location: str | None
    timezone: str
    role: UserRole
    plan: PlanTier
    onboardingCompleted: bool
    aiRecommendationsEnabled: bool
    username: str | None
    headline: str | None
    bio: str | None
    about: str | None
    socialLinks: dict[str, str]
    publicProfileEnabled: bool
    cardTheme: CardTheme
    createdAt: str
    updatedAt: str


class UpdateProfileInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    company: str | None = None
    jobTitle: str | None = None
    location: str | None = None
    timezone: str | None = Field(default=None, min_length=1)
    onboardingCompleted: bool | None = None
    aiRecommendationsEnabled: bool | None = None
    # Deliberately excludes "admin" — self-serve role changes can only ever
    # grant/revoke the recruiter posting privilege, never elevate to admin.
    role: Literal["user", "recruiter"] | None = None

    username: str | None = None
    headline: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=280)
    about: str | None = Field(default=None, max_length=2000)
    socialLinks: dict[str, str] | None = None
    publicProfileEnabled: bool | None = None
    cardTheme: CardTheme | None = None

    @field_validator("username")
    @classmethod
    def _validate_username(cls, v: str | None) -> str | None:
        return validate_username(v) if v else v

    @field_validator("socialLinks")
    @classmethod
    def _validate_social_links(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v is None:
            return v
        unknown = set(v) - ALLOWED_SOCIAL_LINK_KEYS
        if unknown:
            raise ValueError(f"Unknown social link key(s): {', '.join(sorted(unknown))}")
        return {k: url.strip() for k, url in v.items() if url.strip()}


class UsernameAvailableResult(BaseModel):
    available: bool


class PublicProfileDto(BaseModel):
    """The public-facing shape of a user's identity — deliberately excludes
    email/plan/role/company/jobTitle/onboardingCompleted, none of which
    belong on a page anyone on the internet can load."""

    username: str
    name: str
    avatar: str | None
    headline: str | None
    bio: str | None
    about: str | None
    location: str | None
    socialLinks: dict[str, str]
    cardTheme: CardTheme
