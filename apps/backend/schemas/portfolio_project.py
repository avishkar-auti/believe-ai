"""API-facing shapes for Profile > Projects. See models/portfolio_project.py."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PortfolioProjectDto(BaseModel):
    id: str
    name: str
    description: str | None
    technologies: list[str]
    githubUrl: str | None
    liveUrl: str | None
    startDate: str | None
    endDate: str | None
    isCurrent: bool
    order: int


class CreatePortfolioProjectInput(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    githubUrl: str | None = None
    liveUrl: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool = False


class UpdatePortfolioProjectInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    technologies: list[str] | None = None
    githubUrl: str | None = None
    liveUrl: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool | None = None
