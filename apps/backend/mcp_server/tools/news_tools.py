"""MCP tool wrapping the news-feed agentic-RAG pipeline — same LangGraph
graph the REST route uses, so the two surfaces can never drift apart."""

from __future__ import annotations

from core.config import get_settings
from core.db import get_database
from core.security import resolve_mongo_user_id, verify_firebase_token
from mcp_server.registry import server
from services.news_service import get_news_feed


@server.tool()
async def get_personalized_news_feed(
    firebase_id_token: str, mode: str, query: str | None = None, page_size: int = 8
) -> dict:
    """Get a news feed ranked by real embedding retrieval, each article grounded with a
    short reason. mode="resume": grounded in the caller's own uploaded resume. mode="search":
    grounded in `query`.

    Args:
        firebase_id_token: The caller's believe.ai Firebase ID token.
        mode: "resume" or "search".
        query: Required when mode="search" — the search text.
        page_size: How many articles to return (default 8).
    """
    firebase_uid = await verify_firebase_token(firebase_id_token)
    user_id = await resolve_mongo_user_id(firebase_uid)
    result = await get_news_feed(get_settings(), get_database(), user_id, mode, query, page_size)  # type: ignore[arg-type]
    return result.model_dump()
