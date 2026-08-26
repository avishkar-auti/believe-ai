"""Query understanding — decides what text should actually drive retrieval,
and produces both a rich version (for embedding similarity) and a short
version (for a keyword-style external search) from the same source.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class QueryPlan:
    needs_retrieval: bool
    # The richer text handed to the embedding step — long enough to carry
    # real signal, short enough to keep the embedding call cheap.
    query_text: str
    # A short keyword-style phrase, useful for a source that does its own
    # keyword search (e.g. a news API) rather than semantic matching.
    search_keyword: str


def plan_from_source_text(text: str, *, query_text_chars: int = 1500, search_keyword_words: int = 8) -> QueryPlan:
    """Builds a retrieval plan from a larger piece of source text (e.g. a
    stored resume) rather than a short typed query — the search keyword is a
    short prefix, the query text a longer one, both grounded only in the
    real text given (never fabricated)."""
    content = text.strip()
    return QueryPlan(
        needs_retrieval=bool(content),
        query_text=content[:query_text_chars],
        search_keyword=" ".join(content.split()[:search_keyword_words]),
    )


def plan_from_query(query: str) -> QueryPlan:
    """Builds a retrieval plan from a short, already-specific typed query —
    query_text and search_keyword are the same text; there's nothing to
    trim or summarize."""
    trimmed = query.strip()
    return QueryPlan(needs_retrieval=bool(trimmed), query_text=trimmed, search_keyword=trimmed)
