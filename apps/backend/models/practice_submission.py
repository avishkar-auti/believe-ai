"""AI Practice Lab — a Submission is created only by the Submit action (Run
and Evaluate are stateless previews, see services/execution_service.py).
TestOutcome stays a 3-way union so real execution engines need no schema
migration — mock always writes "not_run"; judge0 writes real "passed"/
"failed" (see services/judge0_execution_service.py)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

TestOutcome = Literal["passed", "failed", "not_run"]
# "judge0": real, isolated single-file Python execution (services/judge0_execution_service.py).
# "mock": no code runs at all — the Phase 1 fallback for everything Judge0 can't handle
# (multi-file challenges, anything needing external dependencies).
ExecutionEngine = Literal["mock", "judge0"]


class SubmissionTestResult(BaseModel):
    testCaseId: str
    name: str
    hidden: bool
    outcome: TestOutcome


class Submission(Document):
    userId: PydanticObjectId
    challengeId: PydanticObjectId
    # path -> source, a snapshot at submit time — not a live reference to
    # the challenge's editable state.
    files: dict[str, str]
    language: str = "python"
    engine: ExecutionEngine = "mock"
    # Stays False until a real execution engine exists — never set True by
    # MockExecutionService, so the UI can never claim code actually ran.
    executed: bool = False
    stdout: str | None = None
    stderr: str | None = None
    testResults: list[SubmissionTestResult] = Field(default_factory=list)
    totalCount: int = 0
    # True only when executed=True, totalCount>0, and every test outcome is
    # "passed" — computed once in services/submission_service.py, never for
    # a mock (unexecuted) submission. Drives UserPracticeProgress.
    solved: bool = False
    message: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "practice_submissions"
        indexes = [
            IndexModel([("userId", 1), ("createdAt", -1)]),
            IndexModel([("userId", 1), ("challengeId", 1), ("createdAt", -1)]),
        ]
