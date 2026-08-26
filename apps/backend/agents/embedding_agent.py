"""Computes embedding vectors for a batch of texts — used by apps/api to
build a resume's retrieval index. Stateless: takes texts, returns vectors,
writes nothing (see core/db.py for why this service never writes to Mongo).
"""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import EmbedTextsRequest, EmbedTextsResult


async def embed_texts(settings: Settings, req: EmbedTextsRequest) -> EmbedTextsResult:
    vectors = await with_fallback(settings, "embed_texts", lambda p: p.embed_texts(req.texts, req.input_type))
    return EmbedTextsResult(vectors=vectors)
