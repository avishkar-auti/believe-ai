"""MCP tools wrapping the interview prep services — same code the REST
routes use, so the two surfaces can never drift apart."""

from __future__ import annotations

from core.config import get_settings
from core.db import get_database
from core.security import resolve_mongo_user_id, verify_firebase_token
from mcp_server.registry import server
from schemas.ai import InterviewCoachMessage
from services.interview_service import coach_chat_for_user, generate_questions_for_user


@server.tool()
async def generate_interview_questions_tool(firebase_id_token: str, target_role: str | None = None) -> dict:
    """Generate practice interview questions grounded in the caller's own uploaded resume.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        target_role: Optional role to tailor difficulty/focus toward.
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await generate_questions_for_user(get_settings(), get_database(), user_id, target_role)
    return result.model_dump()


@server.tool()
async def interview_coach_chat(firebase_id_token: str, message: str, history: list[dict] | None = None) -> dict:
    """Get interview-coaching feedback grounded in the caller's own resume.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        message: What the caller wants feedback on, or a question for the coach.
        history: Prior turns as [{"role": "user"|"assistant", "content": str}, ...], oldest first.
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await coach_chat_for_user(
        get_settings(),
        get_database(),
        user_id,
        message,
        [InterviewCoachMessage(**msg) for msg in (history or [])],
    )
    return result.model_dump()
