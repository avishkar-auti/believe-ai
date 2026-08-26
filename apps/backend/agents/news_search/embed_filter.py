from __future__ import annotations

from agents.news_search.state import NewsSearchState
from rag.retriever import embed_and_score, top_k


async def embed_filter_node(state: NewsSearchState) -> NewsSearchState:
    """Retrieval step: the shared rag.retriever embeds the query once
    alongside every candidate article, then narrows the pool by cosine
    similarity. A provider outage degrades to unscored source order rather
    than failing the whole feed — the same "AI assists, never blocks"
    pattern used elsewhere in this service (see build_personalized_content
    in the campaign send flow)."""
    candidates = state.get("candidate_articles") or []
    page_size = state.get("page_size", 8)
    keep = max(page_size * 2, 6)

    if state.get("error") or not candidates:
        return {**state, "scored_candidates": []}

    query_text = state.get("query_text", "")
    doc_texts = [f"{a['title']}. {a.get('description') or ''}" for a in candidates]

    scored = await embed_and_score(state["settings"], query_text, doc_texts)
    kept = top_k(scored, keep)
    scored_candidates = [{**candidates[c.index], "embedding_score": c.score} for c in kept]
    return {**state, "scored_candidates": scored_candidates}
