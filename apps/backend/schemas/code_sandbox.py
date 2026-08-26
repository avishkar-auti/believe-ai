"""API-facing shapes for the practice code sandbox — mirrors apps/api's
codeSandbox controller/service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RunCodeInput(BaseModel):
    language: str = Field(min_length=1)
    sourceCode: str = Field(min_length=1)
    stdin: str = ""


class RunCodeResult(BaseModel):
    stdout: str | None
    stderr: str | None
    compileOutput: str | None
    status: str
    timeSeconds: float | None
    memoryKb: int | None
