"""Believe Profile — API-facing shape mirroring packages/shared's
UserContext type + updateUserContextSchema (each field nullable, optional,
max 2000 chars). See models/user_context.py for the persisted Document."""

from __future__ import annotations

from pydantic import BaseModel, Field


class UserContextDto(BaseModel):
    userId: str
    aboutMe: str | None = None
    companyInfo: str | None = None
    servicesOrProducts: str | None = None
    skillsAndExperience: str | None = None
    achievements: str | None = None
    targetAudience: str | None = None
    updatedAt: str


class UpdateUserContextInput(BaseModel):
    aboutMe: str | None = Field(default=None, max_length=2000)
    companyInfo: str | None = Field(default=None, max_length=2000)
    servicesOrProducts: str | None = Field(default=None, max_length=2000)
    skillsAndExperience: str | None = Field(default=None, max_length=2000)
    achievements: str | None = Field(default=None, max_length=2000)
    targetAudience: str | None = Field(default=None, max_length=2000)
