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

from agents.interview_agent import coach_interview, generate_interview_questions
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from rag.grounding import grounding_overlap, is_grounded
from repositories import resumes_repository
from schemas.ai import (
    InterviewCoachMessage,
    InterviewCoachRequest,
    InterviewCoachResult,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
)

logger = get_logger(__name__)


async def _get_resume_text(db: AsyncIOMotorDatabase, user_id: ObjectId) -> str:
    resume = await resumes_repository.find_by_user_id(db, user_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet")
    return resume["content"]


async def generate_questions_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, target_role: str | None
) -> InterviewQuestionsResult:
    resume_text = await _get_resume_text(db, user_id)
    return await generate_interview_questions(settings, InterviewQuestionsRequest(resumeText=resume_text, targetRole=target_role))


async def coach_chat_for_user(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    message: str,
    history: list[InterviewCoachMessage],
) -> InterviewCoachResult:
    resume_text = await _get_resume_text(db, user_id)
    result = await coach_interview(settings, InterviewCoachRequest(resumeText=resume_text, message=message, history=history))

    if not is_grounded(result.reply, resume_text):
        logger.warning(
            "Interview coach reply for user %s scored low on the grounding check (overlap=%.2f)",
            user_id,
            grounding_overlap(result.reply, resume_text),
        )

    return result
