"""Interview prep: question generation and coaching chat, both grounded in
the resume passed in — the caller (services/interview_service.py) is
responsible for supplying real stored text, not this agent."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import (
    InterviewAnswerFeedbackRequest,
    InterviewAnswerFeedbackResult,
    InterviewCoachRequest,
    InterviewCoachResult,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
)


async def generate_interview_questions(settings: Settings, req: InterviewQuestionsRequest) -> InterviewQuestionsResult:
    return await with_fallback(
        settings, "generate_interview_questions", lambda p: p.generate_interview_questions(req)
    )


async def coach_interview(settings: Settings, req: InterviewCoachRequest) -> InterviewCoachResult:
    return await with_fallback(settings, "coach_interview", lambda p: p.coach_interview(req))


async def analyze_interview_answer(settings: Settings, req: InterviewAnswerFeedbackRequest) -> InterviewAnswerFeedbackResult:
    return await with_fallback(settings, "analyze_interview_answer", lambda p: p.analyze_interview_answer(req))
