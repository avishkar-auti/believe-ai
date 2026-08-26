"""Reusable agentic-RAG building blocks — query understanding, retrieval,
reranking, grounding — used by every retrieval-touching agent instead of
each one hand-rolling its own top-k-cosine logic. Piloted end to end on
agents/news_search/; Resume Chat, Career Fit, Roadmap, and Interview Coach
retrofit onto this same module in a later phase.
"""
