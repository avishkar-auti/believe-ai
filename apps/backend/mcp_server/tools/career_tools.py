"""MCP tools wrapping the career fit and roadmap services — same code the
REST routes use, so the two surfaces can never drift apart."""

from __future__ import annotations

from core.config import get_settings
from core.db import get_database
from core.security import resolve_mongo_user_id, verify_firebase_token
from mcp_server.registry import server
from services.career_fit_service import analyze_career_fit_for_user
from services.roadmap_service import build_roadmap_for_user


@server.tool()
async def analyze_career_fit(firebase_id_token: str, target_role: str | None = None) -> dict:
    """Assess the caller's own uploaded resume against the job market, or a specific target role.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        target_role: Optional role to evaluate against, e.g. "Senior Backend Engineer".
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await analyze_career_fit_for_user(get_settings(), get_database(), user_id, target_role)
    return result.model_dump()


@server.tool()
async def build_learning_roadmap(firebase_id_token: str, goal: str) -> dict:
    """Build a staged learning roadmap toward a goal, grounded in the caller's own resume.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        goal: What the caller wants to work toward, e.g. "become a senior backend engineer".
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await build_roadmap_for_user(get_settings(), get_database(), user_id, goal)
    return result.model_dump()
