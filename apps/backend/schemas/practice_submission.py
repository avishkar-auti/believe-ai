"""API-facing shapes for Run/Evaluate/Submit — mirrors packages/shared's
Submission/ExecutionResult types."""

from __future__ import annotations

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from models.practice_submission import ExecutionEngine, TestOutcome


class RunSubmissionInput(BaseModel):
    """Body for POST /practice/challenges/{slug}/run and /evaluate — no
    challengeId, since the slug in the URL already identifies it."""

    files: dict[str, str] = Field(min_length=1)
    language: str = "python"


class CreateSubmissionInput(BaseModel):
    """Body for POST /practice/submissions — the only action that persists."""

    challengeId: PydanticObjectId
    files: dict[str, str] = Field(min_length=1)
    language: str = "python"


class SubmissionTestResultDto(BaseModel):
    testCaseId: str
    name: str
    hidden: bool
    outcome: TestOutcome


class ExecutionResultDto(BaseModel):
    """Response for the stateless Run/Evaluate actions."""

    engine: ExecutionEngine
    executed: bool
    stdout: str | None
    stderr: str | None
    testResults: list[SubmissionTestResultDto]
    totalCount: int
    message: str


class SubmissionDto(BaseModel):
    id: str
    challengeId: str
    files: dict[str, str]
    language: str
    engine: ExecutionEngine
    executed: bool
    stdout: str | None
    stderr: str | None
    testResults: list[SubmissionTestResultDto]
    totalCount: int
    solved: bool
    message: str
    createdAt: str
