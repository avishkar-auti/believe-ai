"""Ask My Resume — retrieval-augmented chat over the caller's own stored
resume. Mirrors campaign_insights_service.py's shape: read the caller's own
data (read-only, scoped by Mongo user id), then hand only what's relevant to
the agent — never the whole resume, just the top-matching excerpts.

Retrofit onto the shared rag/ module (Phase 6): rag.retriever replaces this
service's own top_k_chunks helper, and every answer's groundedness in the
retrieved excerpts is logged — real signal for catching drift, not a hard
gate. The check is a word-overlap heuristic, not a semantic one, so a
correct answer that simply paraphrases the resume can score low; blocking on
that would trade a rare hallucination for a much more common false rejection
of a perfectly good answer.
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.resume_chat_agent import chat_about_resume
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from rag.grounding import grounding_overlap, is_grounded
from rag.query_analysis import plan_from_query
from rag.retriever import embed_query_and_score, top_k
from repositories import resumes_repository
from schemas.ai import ResumeChatRequest, ResumeChatResult

logger = get_logger(__name__)

TOP_K_CHUNKS = 5


async def chat_about_resume_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, req: ResumeChatRequest
) -> ResumeChatResult:
    resume = await resumes_repository.resolve_for_user(db, user_id, req.resumeId)
    if not resume:
        raise NotFoundError("No resume uploaded yet" if not req.resumeId else "Resume not found")

    chunks = resume.get("chunks") or []
    embedded_chunks = [c for c in chunks if c.get("vector")]
    if not embedded_chunks:
        raise NotFoundError("Resume hasn't finished processing yet — try again shortly")

    plan = plan_from_query(req.question)
    scored = await embed_query_and_score(settings, plan.query_text, [c.get("vector") for c in embedded_chunks])
    top_chunks = [embedded_chunks[c.index] for c in top_k(scored, TOP_K_CHUNKS)]
    excerpts = [c["text"] for c in top_chunks]

    result = await chat_about_resume(settings, req, excerpts)

    source_text = "\n".join(excerpts)
    if not is_grounded(result.answer, source_text):
        logger.warning(
            "Resume Chat answer for user %s scored low on the grounding check (overlap=%.2f) — may have drifted",
            user_id,
            grounding_overlap(result.answer, source_text),
        )

    return result
