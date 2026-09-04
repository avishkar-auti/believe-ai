"""One entry in a user's work-experience list — part of the LinkedIn-style
Profile page, distinct from the free-text "Believe Profile" AI-context
fields on UserContext."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

EmploymentType = Literal["Full-time", "Part-time", "Internship", "Contract", "Freelance", "Self-employed"]


class Experience(Document):
    userId: PydanticObjectId
    title: str
    company: str
    employmentType: EmploymentType = "Full-time"
    location: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool = False
    description: str | None = None
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "experiences"
        indexes = [IndexModel([("userId", 1), ("order", 1)])]
