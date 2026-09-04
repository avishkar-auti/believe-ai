"""Mirrors packages/server/src/models/User.model.ts — same "users" collection,
same field shapes. Field names stay camelCase (not snake_case) to match the
Mongo documents Node already writes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

UserRole = Literal["user", "admin", "recruiter"]
PlanTier = Literal["FREE", "PRO", "BUSINESS", "ENTERPRISE"]
CardTheme = Literal["minimal", "aurora", "midnight", "holographic"]


class User(Document):
    firebaseUid: str
    email: str
    name: str = ""
    avatar: str | None = None
    coverImage: str | None = None
    company: str | None = None
    jobTitle: str | None = None
    location: str | None = None
    timezone: str = "UTC"
    role: UserRole = "user"
    plan: PlanTier = "FREE"
    onboardingCompleted: bool = False
    aiRecommendationsEnabled: bool = True

    # Believe Identity / public profile — additive, all optional/defaulted so
    # every existing document stays valid without a migration.
    username: str | None = None
    headline: str | None = None
    bio: str | None = None
    about: str | None = None
    socialLinks: dict[str, str] = Field(default_factory=dict)
    publicProfileEnabled: bool = False
    cardTheme: CardTheme = "minimal"

    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "users"
        indexes = [
            # A plain sparse index only skips documents missing the field —
            # Beanie serializes username=None as an explicit `null`, which a
            # sparse index still indexes, so two usernameless users collide.
            # $type: "string" excludes null (and missing) values instead.
            IndexModel(
                [("username", 1)],
                unique=True,
                partialFilterExpression={"username": {"$type": "string"}},
            )
        ]
