"""The caller's own resume — mirrors apps/api's resume.service.ts. Parsing
and chunking happen here, not behind a separate AI call, so a resume can be
stored and browsed even if every AI provider is down — only the embedding
step depends on AI, and a partially-embedded resume degrades gracefully
(embeddingReady: false) rather than failing the whole upload."""

from __future__ import annotations

import io

from bson import ObjectId
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from agents.embedding_agent import embed_texts
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from core.logging import get_logger
from models.resume import Resume, ResumeChunk
from repositories import resume_repository
from schemas.ai import EmbedTextsRequest
from schemas.resume import ResumeChunkDto, ResumeDto
from utils.chunk_text import chunk_text

logger = get_logger(__name__)

_MAX_RESUME_BYTES = 4 * 1024 * 1024


def _to_dto(doc: Resume) -> ResumeDto:
    assert doc.id is not None
    return ResumeDto(
        id=str(doc.id),
        userId=str(doc.userId),
        fileName=doc.fileName,
        mimeType=doc.mimeType,
        sizeBytes=doc.sizeBytes,
        content=doc.content,
        chunks=[ResumeChunkDto(text=c.text, vector=c.vector) for c in doc.chunks],
        embeddingReady=len(doc.chunks) > 0 and all(c.vector is not None for c in doc.chunks),
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _extract_pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except PdfReadError as err:
        raise ValidationError("Could not read this PDF — it may be corrupted or scanned as images") from err
    return text.strip()


async def get_by_user_id(user_id: ObjectId) -> ResumeDto:
    resume = await resume_repository.find_by_user_id(user_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet")
    return _to_dto(resume)


async def upload(settings: Settings, user_id: ObjectId, file_name: str, mime_type: str, data: bytes) -> ResumeDto:
    if mime_type != "application/pdf":
        raise ValidationError("Only PDF resumes are supported right now")
    if len(data) > _MAX_RESUME_BYTES:
        raise ValidationError("Resume must be under 4 MB")

    content = _extract_pdf_text(data)
    if not content:
        raise ValidationError("No extractable text found in this PDF")

    chunks = [ResumeChunk(text=text, vector=None) for text in chunk_text(content)]

    await resume_repository.upsert_file(user_id, file_name, mime_type, data)
    resume = await resume_repository.upsert(user_id, file_name, mime_type, len(data), content, chunks)

    # Embedding failure shouldn't fail the upload — the resume is stored and
    # usable (e.g. for direct display) even before it's RAG-ready. The
    # caller can re-trigger embedding by re-uploading.
    try:
        result = await embed_texts(settings, EmbedTextsRequest(texts=[c.text for c in chunks]))
        embedded = await resume_repository.set_chunk_vectors(user_id, list(result.vectors))
        return _to_dto(embedded or resume)
    except Exception as err:  # noqa: BLE001 — see docstring: a failed embed must never fail the upload
        logger.warning("Resume embedding failed for user %s, resume stored without vectors: %s", user_id, err)
        return _to_dto(resume)


async def delete(user_id: ObjectId) -> None:
    deleted = await resume_repository.delete(user_id)
    if not deleted:
        raise NotFoundError("No resume uploaded yet")
