"""MCP tools operating on real stored data. Since MCP tool calls carry plain
arguments (no HTTP headers), the caller passes their believe.ai Firebase ID
token explicitly — verified the same way as the REST routes.
"""

from __future__ import annotations

from core.config import get_settings
from core.db import get_database
from core.security import resolve_mongo_user_id, verify_firebase_token
from mcp_server.registry import server
from services.campaign_insights_service import get_campaign_insights
from services.personalize_contact_service import personalize_for_contact
from utils.object_id import parse_object_id


@server.tool()
async def get_campaign_insights_tool(firebase_id_token: str, campaign_id: str) -> dict:
    """Get AI-generated insights for one of the caller's own campaigns, computed
    from its real stored send/open/click/reply numbers.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        campaign_id: Mongo id of the campaign (must belong to the token's account).
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await get_campaign_insights(get_settings(), user_id, parse_object_id(campaign_id))
    return result.model_dump()


@server.tool()
async def personalize_for_contact_tool(firebase_id_token: str, campaign_id: str, contact_id: str) -> dict:
    """Personalize a campaign's email for one of the caller's own stored contacts.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        campaign_id: Mongo id of the campaign (must belong to the token's account).
        contact_id: Mongo id of the contact (must belong to the token's account).
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await personalize_for_contact(
        get_settings(), get_database(), user_id, parse_object_id(campaign_id), parse_object_id(contact_id)
    )
    return result.model_dump()
