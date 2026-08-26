"""Mirrors apps/api's chunkText.ts — splits text into overlapping ~400-char
windows for embedding + retrieval. The overlap means a sentence that
straddles a chunk boundary still appears whole in at least one chunk, so
similarity search doesn't miss it."""

from __future__ import annotations

import re

_CHUNK_SIZE = 400
_CHUNK_OVERLAP = 100


def chunk_text(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(start + _CHUNK_SIZE, len(normalized))
        chunks.append(normalized[start:end])
        if end == len(normalized):
            break
        start = end - _CHUNK_OVERLAP
    return chunks
