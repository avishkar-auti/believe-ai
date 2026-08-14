"""MCP tools wrapping the resume agents/services — same code the REST routes
use, so the two surfaces can never drift apart."""

from __future__ import annotations

from agents.embedding_agent import embed_texts
from core.config import get_settings
from core.db import get_database
from core.security import resolve_mongo_user_id, verify_firebase_token
from mcp_server.registry import server
from schemas.ai import EmbedTextsRequest, ResumeChatMessage, ResumeChatRequest
from services.resume_chat_service import chat_about_resume_for_user


@server.tool()
async def embed_resume_chunks(texts: list[str]) -> dict:
    """Compute embedding vectors for a batch of texts (e.g. resume chunks).

    Args:
        texts: The texts to embed, in order — the returned vectors line up positionally.
    """
    settings = get_settings()
    result = await embed_texts(settings, EmbedTextsRequest(texts=texts))
    return result.model_dump()


@server.tool()
async def ask_my_resume(firebase_id_token: str, question: str, history: list[dict] | None = None) -> dict:
    """Answer a question about the caller's own uploaded resume, grounded in
    the most relevant excerpts (retrieval-augmented, never the whole resume).

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        question: The question to answer.
        history: Prior turns as [{"role": "user"|"assistant", "content": str}, ...], oldest first.
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    req = ResumeChatRequest(
        question=question,
        history=[ResumeChatMessage(**msg) for msg in (history or [])],
    )
    result = await chat_about_resume_for_user(get_settings(), get_database(), user_id, req)
    return result.model_dump()
