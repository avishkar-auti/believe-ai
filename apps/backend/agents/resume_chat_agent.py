"""Answers a question about a resume, grounded in retrieved excerpts —
context_chunks come from the caller's retrieval step (services/resume_chat_service.py),
not from this agent, so it never sees more of the resume than was retrieved."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import ResumeChatRequest, ResumeChatResult


async def chat_about_resume(settings: Settings, req: ResumeChatRequest, context_chunks: list[str]) -> ResumeChatResult:
    return await with_fallback(settings, "chat_about_resume", lambda p: p.chat_about_resume(req, context_chunks))
