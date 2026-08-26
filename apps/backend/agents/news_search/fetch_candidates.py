from __future__ import annotations

from agents.news_search.state import NewsSearchState
from clients.news_source_client import get_news_source_provider
from core.logging import get_logger

logger = get_logger(__name__)


async def fetch_candidates_node(state: NewsSearchState) -> NewsSearchState:
    if state.get("error"):
        return state

    page_size = state.get("page_size", 8)
    pool_size = max(page_size * 3, 12)  # over-fetch so embed/rank has a real pool to work with

    try:
        provider = get_news_source_provider(state["settings"])
        articles = await provider.fetch(state.get("raw_query") or "general tech", pool_size)
        return {**state, "candidate_articles": [a.model_dump() for a in articles]}
    except Exception as err:  # noqa: BLE001 — a bad news-source call degrades to an empty feed, not a 502
        logger.warning("News source fetch failed, feed will be empty: %s", err)
        return {**state, "candidate_articles": []}
