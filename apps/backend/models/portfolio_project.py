"""One project card on the Profile page. Named PortfolioProject (not
Project) so it doesn't collide with Design Studio's unrelated DesignProject
collection."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class PortfolioProject(Document):
    userId: PydanticObjectId
    name: str
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    githubUrl: str | None = None
    liveUrl: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool = False
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "portfolioprojects"
        indexes = [IndexModel([("userId", 1), ("order", 1)])]
