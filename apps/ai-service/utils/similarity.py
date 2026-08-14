"""Cosine similarity ranking over resume chunk embeddings — no vector DB
needed at this scale (a resume is a few dozen chunks at most)."""

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


def top_k_chunks(query_vector: list[float], chunks: list[dict], k: int) -> list[dict]:
    """Ranks chunks by similarity to query_vector. Chunks without a vector
    yet (embedding still pending or failed) are skipped rather than treated
    as a zero-similarity match — an unranked chunk isn't "irrelevant", it's
    just not comparable.
    """
    scored = [(cosine_similarity(query_vector, c["vector"]), c) for c in chunks if c.get("vector")]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _score, chunk in scored[:k]]
