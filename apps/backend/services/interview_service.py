"""Interview Prep: reads the caller's own stored resume (read-only, scoped
by Mongo user id) and hands the full text to the interview agent. Both
capabilities are ephemeral — nothing here persists, same shape as
campaign_insights_service.py.

Retrofit onto the shared rag/ module (Phase 6): coaching replies respond to
specific resume content in an ongoing dialogue (closer to Resume Chat's
shape than to a one-shot analysis), so their groundedness is logged the same
way. Question generation is deliberately skipped — a good interview question
*probes* the resume rather than restating it, so a low word-overlap score
there isn't a meaningful hallucination signal the way it is for a reply.
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.interview_agent import analyze_interview_answer, coach_interview, generate_interview_questions
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from core.rate_limit import enforce_rate_limit
from rag.grounding import grounding_overlap, is_grounded
from repositories import resumes_repository
from schemas.ai import (
    InterviewAnswerFeedbackRequest,
    InterviewAnswerFeedbackResult,
    InterviewCoachMessage,
    InterviewCoachRequest,
    InterviewCoachResult,
    InterviewDifficulty,
    InterviewQuestionCategory,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
    InterviewType,
)

logger = get_logger(__name__)

_WINDOW_SECONDS = 60 * 60
# Generating a fresh question set is the priciest call (long resume-grounded
# prompt) — coach chat is the cheapest and gets hit by hints/concepts too, so
# it gets the most headroom; answer feedback sits in between.
_QUESTIONS_LIMIT_PER_HOUR = 15
_COACH_LIMIT_PER_HOUR = 40
_ANSWER_LIMIT_PER_HOUR = 30


async def _get_resume_text(db: AsyncIOMotorDatabase, user_id: ObjectId, resume_id: ObjectId | None) -> str:
    resume = await resumes_repository.resolve_for_user(db, user_id, resume_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet" if not resume_id else "Resume not found")
    return resume["content"]


async def generate_questions_for_user(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    target_role: str | None,
    resume_id: ObjectId | None = None,
    interview_type: InterviewType | None = None,
    difficulty: InterviewDifficulty | None = None,
    job_title: str | None = None,
    job_company: str | None = None,
    job_description: str | None = None,
) -> InterviewQuestionsResult:
    await enforce_rate_limit("interview_questions", str(user_id), _QUESTIONS_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    resume_text = await _get_resume_text(db, user_id, resume_id)
    return await generate_interview_questions(
        settings,
        InterviewQuestionsRequest(
            resumeText=resume_text,
            targetRole=target_role,
            interviewType=interview_type,
            difficulty=difficulty,
            jobTitle=job_title,
            jobCompany=job_company,
            jobDescription=job_description,
        ),
    )


async def coach_chat_for_user(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    message: str,
    history: list[InterviewCoachMessage],
    resume_id: ObjectId | None = None,
) -> InterviewCoachResult:
    await enforce_rate_limit("interview_coach", str(user_id), _COACH_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    resume_text = await _get_resume_text(db, user_id, resume_id)
    result = await coach_interview(settings, InterviewCoachRequest(resumeText=resume_text, message=message, history=history))

    if not is_grounded(result.reply, resume_text):
        logger.warning(
            "Interview coach reply for user %s scored low on the grounding check (overlap=%.2f)",
            user_id,
            grounding_overlap(result.reply, resume_text),
        )

    return result


async def answer_feedback_for_user(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    question: str,
    category: InterviewQuestionCategory,
    answer: str,
    target_role: str | None = None,
    resume_id: ObjectId | None = None,
) -> InterviewAnswerFeedbackResult:
    await enforce_rate_limit("interview_answer", str(user_id), _ANSWER_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    resume_text = await _get_resume_text(db, user_id, resume_id)
    return await analyze_interview_answer(
        settings,
        InterviewAnswerFeedbackRequest(
            resumeText=resume_text, question=question, category=category, answer=answer, targetRole=target_role
        ),
    )
