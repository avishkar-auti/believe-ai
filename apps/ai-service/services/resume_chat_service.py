"""Ask My Resume — retrieval-augmented chat over the caller's own stored
resume. Mirrors campaign_insights_service.py's shape: read the caller's own
data (read-only, scoped by Mongo user id), then hand only what's relevant to
the agent — never the whole resume, just the top-matching excerpts.
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.embedding_agent import embed_texts
from agents.resume_chat_agent import chat_about_resume
from core.config import Settings
from core.errors import NotFoundError
from repositories import resumes_repository
from schemas.ai import EmbedTextsRequest, ResumeChatRequest, ResumeChatResult
from utils.similarity import top_k_chunks

TOP_K_CHUNKS = 5


async def chat_about_resume_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, req: ResumeChatRequest
) -> ResumeChatResult:
    resume = await resumes_repository.find_by_user_id(db, user_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet")

    chunks = resume.get("chunks") or []
    embedded_chunks = [c for c in chunks if c.get("vector")]
    if not embedded_chunks:
        raise NotFoundError("Resume hasn't finished processing yet — try again shortly")

    [question_vector] = (await embed_texts(settings, EmbedTextsRequest(texts=[req.question]))).vectors
    top_chunks = top_k_chunks(question_vector, embedded_chunks, TOP_K_CHUNKS)

    return await chat_about_resume(settings, req, [c["text"] for c in top_chunks])
