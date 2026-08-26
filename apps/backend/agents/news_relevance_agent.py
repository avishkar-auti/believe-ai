"""Generates a short, grounded "why this matters to you" reason per article —
the generation half of the news feed's retrieval-augmented pipeline
(agents/news_search/). Never invents facts about the reader or an article;
grounds each reason only in that article's own title/description and the
query text used to retrieve it."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import NewsRelevanceRequest, NewsRelevanceResult


async def generate_news_relevance(settings: Settings, req: NewsRelevanceRequest) -> NewsRelevanceResult:
    return await with_fallback(settings, "generate_news_relevance", lambda p: p.generate_news_relevance(req))
