"""Interview Prep session history — see models/interview_session.py for why
only per-answer scores are accepted here, never question/answer text."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CompleteInterviewSessionInput(BaseModel):
    targetRole: str | None = None
    interviewType: str = Field(min_length=1)
    difficulty: str | None = None
    totalQuestions: int = Field(ge=0)
    # One real overallScore (0-100) per question actually answered during
    # the session, in the order they were answered — the aggregate is always
    # computed server-side from these, never trusted from the client directly.
    answerScores: list[int] = Field(default_factory=list)
    startedAt: datetime


class InterviewSessionSummaryDto(BaseModel):
    id: str
    targetRole: str | None
    interviewType: str
    difficulty: str | None
    totalQuestions: int
    answeredCount: int
    overallScore: int | None
    startedAt: str
    completedAt: str
