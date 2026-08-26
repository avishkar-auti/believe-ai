from __future__ import annotations

from agents.news_search.state import NewsSearchState
from rag.rerank import finalize
from rag.retriever import ScoredCandidate


async def rerank_node(state: NewsSearchState) -> NewsSearchState:
    """Delegates to the shared rag.rerank module — see its docstring for why
    this reuses the embedding score today and how a real rerank model would
    plug in later without touching this node."""
    candidates = state.get("scored_candidates") or []
    page_size = state.get("page_size", 8)

    scored = [ScoredCandidate(index=i, score=a["embedding_score"]) for i, a in enumerate(candidates)]
    top = finalize(scored, page_size)
    ranked_articles = [{**candidates[c.index], "relevance_score": c.score} for c in top]
    return {**state, "ranked_articles": ranked_articles}
