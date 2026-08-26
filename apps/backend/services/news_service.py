"""Resume-personalized news feed — agentic RAG: embeddings retrieve/filter
real candidate articles, then a grounded generation step explains why each
one matters to this reader. Orchestrated as a LangGraph pipeline
(agents/news_search/) rather than a single function since it's a genuine
multi-stage retrieve -> filter -> rank -> generate flow, unlike this
service's single-shot capabilities.
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.news_search.graph import news_search_graph
from core.config import Settings
from core.errors import NotFoundError
from schemas.ai import NewsFeedResult, NewsMode, ScoredArticle


async def get_news_feed(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    mode: NewsMode,
    query: str | None,
    page_size: int,
) -> NewsFeedResult:
    result = await news_search_graph.ainvoke(
        {
            "mode": mode,
            "settings": settings,
            "db": db,
            "user_id": user_id,
            "raw_query": query or "",
            "page_size": page_size,
        }
    )
    if result.get("error"):
        raise NotFoundError(result["error"])

    articles = [
        ScoredArticle(
            title=a["title"],
            description=a.get("description"),
            url=a["url"],
            source=a["source"],
            publishedAt=a.get("published_at"),
            embeddingScore=a.get("embedding_score"),
            relevanceScore=a.get("relevance_score"),
            whyRelevant=a.get("why_relevant"),
        )
        for a in result.get("ranked_articles", [])
    ]
    return NewsFeedResult(articles=articles, mode=mode, queryUsed=result.get("query_text", "")[:120])
