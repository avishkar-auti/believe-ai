"""Final-ranking step, applied after retriever.py's coarse filter narrows
the candidate pool. No dedicated cross-encoder rerank model is configured
today, so this reuses each candidate's retrieval score — a documented,
deliberate fallback, not a placeholder. Kept as its own module (distinct
from retriever.py) so a real rerank model is a drop-in replacement for
finalize() alone, with no change to retrieval or generation.
"""

from __future__ import annotations

from rag.retriever import ScoredCandidate, top_k


def finalize(scored: list[ScoredCandidate], k: int) -> list[ScoredCandidate]:
    return top_k(scored, k)
