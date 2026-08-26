"""API-facing shapes for Design Studio."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

DesignPlatform = Literal["web", "mobile"]


class DesignScreenPositionDto(BaseModel):
    x: float
    y: float


class DesignScreenDto(BaseModel):
    id: str
    title: str
    prompt: str
    platform: DesignPlatform
    dsl: dict[str, Any]
    canvasPosition: DesignScreenPositionDto
    createdAt: str
    updatedAt: str


class DesignScreenSummaryDto(BaseModel):
    """Canvas-view shape — includes dsl so every visible screen can render a live thumbnail preview."""

    id: str
    title: str
    platform: DesignPlatform
    dsl: dict[str, Any]
    canvasPosition: DesignScreenPositionDto
    updatedAt: str


class CreateDesignScreenInput(BaseModel):
    prompt: str = Field(min_length=1)
    platform: DesignPlatform


class EditDesignScreenInput(BaseModel):
    instruction: str = Field(min_length=1)


class UpdateDesignScreenPositionInput(BaseModel):
    x: float
    y: float


class DesignProjectDto(BaseModel):
    id: str
    name: str
    screenCount: int
    createdAt: str
    updatedAt: str


class CreateDesignProjectInput(BaseModel):
    name: str = Field(default="Untitled design")
