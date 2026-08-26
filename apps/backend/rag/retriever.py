"""Embedding-based retrieval over an arbitrary candidate pool — the shared
coarse-filtering step every retrieval-touching agent uses instead of hand-
rolling its own top-k-cosine logic. A provider outage degrades to unscored
order (None scores, never a fabricated zero) so callers can tell "couldn't
score this" apart from "scored and ranked last".
"""

from __future__ import annotations

from dataclasses import dataclass

from agents.embedding_agent import embed_texts
from core.config import Settings
from core.logging import get_logger
from schemas.ai import EmbedTextsRequest
from utils.similarity import cosine_similarity

logger = get_logger(__name__)


@dataclass(frozen=True)
class ScoredCandidate:
    # Position in the doc_texts list passed to embed_and_score — callers use
    # this to map back to their own candidate objects and, where relevant,
    # propagate a citation (the candidate's own id/url) into a final answer.
    index: int
    score: float | None


async def embed_and_score(settings: Settings, query_text: str, doc_texts: list[str]) -> list[ScoredCandidate]:
    """Embeds the query once alongside every candidate document in a single
    call, returns one cosine-similarity score per candidate in input order.
    For an ephemeral candidate pool (e.g. a batch of external search
    results) that has no embedding of its own yet."""
    if not doc_texts:
        return []

    try:
        result = await embed_texts(settings, EmbedTextsRequest(texts=[query_text, *doc_texts]))
    except Exception as err:  # noqa: BLE001 — embeddings unavailable degrades to unscored order, not a hard failure
        logger.warning("Retrieval embedding failed, candidates will be unscored: %s", err)
        return [ScoredCandidate(index=i, score=None) for i in range(len(doc_texts))]

    query_vector, *doc_vectors = result.vectors
    return [
        ScoredCandidate(
            index=i,
            score=cosine_similarity(query_vector, vector) if query_vector and vector else None,
        )
        for i, vector in enumerate(doc_vectors)
    ]


async def embed_query_and_score(settings: Settings, query_text: str, doc_vectors: list[list[float] | None]) -> list[ScoredCandidate]:
    """Embeds only the query and scores it against vectors a corpus already
    carries from its own ingestion step (e.g. resume chunks embedded once at
    upload) — the query-only counterpart to embed_and_score's embed-
    everything-together shape, for a persistent rather than ephemeral
    candidate pool. A candidate with no vector yet (still processing, or a
    prior embedding failure) scores None rather than 0.0 — unscored, not
    irrelevant."""
    if not doc_vectors:
        return []

    try:
        result = await embed_texts(settings, EmbedTextsRequest(texts=[query_text], input_type="query"))
        (query_vector,) = result.vectors
    except Exception as err:  # noqa: BLE001 — embeddings unavailable degrades to unscored order, not a hard failure
        logger.warning("Retrieval query embedding failed, candidates will be unscored: %s", err)
        return [ScoredCandidate(index=i, score=None) for i in range(len(doc_vectors))]

    return [
        ScoredCandidate(
            index=i,
            score=cosine_similarity(query_vector, vector) if query_vector and vector else None,
        )
        for i, vector in enumerate(doc_vectors)
    ]


def top_k(scored: list[ScoredCandidate], k: int) -> list[ScoredCandidate]:
    """Highest-scored first; unscored candidates (score=None) sort last
    rather than being dropped, so a total provider outage still returns
    *something* in source order instead of an empty result."""
    return sorted(scored, key=lambda c: c.score if c.score is not None else -1, reverse=True)[:k]
