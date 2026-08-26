"""Resume-personalized news feed — agentic RAG as a real multi-step LangGraph
pipeline: resolve_query -> fetch_candidates -> embed_filter (retrieval) ->
rerank -> generate_relevance (grounded generation). Retrieval and generation
are separate, swappable steps — a real cross-encoder rerank model or a
smarter query-rewrite step can be dropped into this graph later without
touching the others.
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from agents.news_search.embed_filter import embed_filter_node
from agents.news_search.fetch_candidates import fetch_candidates_node
from agents.news_search.generate_relevance import generate_relevance_node
from agents.news_search.rerank import rerank_node
from agents.news_search.resolve_query import resolve_query_node
from agents.news_search.state import NewsSearchState


def build_news_search_graph():
    graph = StateGraph(NewsSearchState)
    graph.add_node("resolve_query", resolve_query_node)
    graph.add_node("fetch_candidates", fetch_candidates_node)
    graph.add_node("embed_filter", embed_filter_node)
    graph.add_node("rerank", rerank_node)
    graph.add_node("generate_relevance", generate_relevance_node)

    graph.set_entry_point("resolve_query")
    graph.add_edge("resolve_query", "fetch_candidates")
    graph.add_edge("fetch_candidates", "embed_filter")
    graph.add_edge("embed_filter", "rerank")
    graph.add_edge("rerank", "generate_relevance")
    graph.add_edge("generate_relevance", END)
    return graph.compile()


news_search_graph = build_news_search_graph()
