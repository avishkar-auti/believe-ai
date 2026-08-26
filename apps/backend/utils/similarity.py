"""Cosine similarity — the one comparison every embedding-based retrieval in
rag/retriever.py is built on. (The higher-level per-feature top-k ranking
this module used to also provide, top_k_chunks, moved into rag/retriever.py
itself in Phase 6, as the shared embed_query_and_score + top_k pair every
retrieval-touching agent now uses instead of hand-rolling its own.)"""

from __future__ import annotations

import math


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
