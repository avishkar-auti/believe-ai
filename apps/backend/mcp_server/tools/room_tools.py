"""MCP tools wrapping the group-practice-room services — same code the REST
routes use, so the two surfaces can never drift apart."""

from __future__ import annotations

from bson import ObjectId

from core.config import get_settings
from core.db import get_database
from core.security import verify_firebase_token
from mcp_server.registry import server
from services.room_question_service import generate_questions_for_room
from services.room_recap_service import build_recap_for_room
from services.room_summary_service import build_summary_for_room


@server.tool()
async def generate_room_questions_tool(firebase_id_token: str, room_id: str) -> dict:
    """Generate open-ended discussion questions for a group practice room.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        room_id: The Mongo id of the practice room.
    """
    await verify_firebase_token(firebase_id_token)
    result = await generate_questions_for_room(get_settings(), get_database(), ObjectId(room_id))
    return result.model_dump()


@server.tool()
async def generate_room_recap_tool(firebase_id_token: str, room_id: str) -> dict:
    """Build a short rolling recap of a group practice room's progress so far.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        room_id: The Mongo id of the practice room.
    """
    await verify_firebase_token(firebase_id_token)
    result = await build_recap_for_room(get_settings(), get_database(), ObjectId(room_id))
    return result.model_dump()


@server.tool()
async def generate_room_summary_tool(firebase_id_token: str, room_id: str) -> dict:
    """Build the post-call summary for a group practice room — a group recap
    plus one strength/growth-area note per participant.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        room_id: The Mongo id of the practice room.
    """
    await verify_firebase_token(firebase_id_token)
    result = await build_summary_for_room(get_settings(), get_database(), ObjectId(room_id))
    return result.model_dump()
