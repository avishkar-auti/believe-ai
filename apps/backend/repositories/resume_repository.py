"""Beanie-backed access to the caller's own resume (metadata + raw file) —
mirrors apps/api's resume.repository.ts."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.resume import Resume, ResumeChunk, ResumeFile


async def find_by_user_id(user_id: ObjectId) -> Resume | None:
    return await Resume.find_one(Resume.userId == user_id)


async def upsert(user_id: ObjectId, file_name: str, mime_type: str, size_bytes: int, content: str, chunks: list[ResumeChunk]) -> Resume:
    """One resume per user — re-uploading replaces the previous document wholesale."""
    existing = await find_by_user_id(user_id)
    if existing:
        existing.fileName = file_name
        existing.mimeType = mime_type
        existing.sizeBytes = size_bytes
        existing.content = content
        existing.chunks = chunks
        existing.updatedAt = datetime.now(UTC)
        await existing.save()
        return existing

    doc = Resume(userId=user_id, fileName=file_name, mimeType=mime_type, sizeBytes=size_bytes, content=content, chunks=chunks)
    await doc.insert()
    return doc


async def set_chunk_vectors(user_id: ObjectId, vectors: list[list[float] | None]) -> Resume | None:
    """Each vector lines up with the chunk at the same index that was embedded."""
    doc = await find_by_user_id(user_id)
    if not doc:
        return None
    for i, vector in enumerate(vectors):
        if i < len(doc.chunks):
            doc.chunks[i].vector = vector
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(user_id: ObjectId) -> bool:
    resume = await find_by_user_id(user_id)
    resume_file = await ResumeFile.find_one(ResumeFile.userId == user_id)
    if resume:
        await resume.delete()
    if resume_file:
        await resume_file.delete()
    return resume is not None


async def upsert_file(user_id: ObjectId, file_name: str, mime_type: str, data: bytes) -> ResumeFile:
    existing = await ResumeFile.find_one(ResumeFile.userId == user_id)
    if existing:
        existing.fileName = file_name
        existing.mimeType = mime_type
        existing.data = data
        existing.updatedAt = datetime.now(UTC)
        await existing.save()
        return existing

    doc = ResumeFile(userId=user_id, fileName=file_name, mimeType=mime_type, data=data)
    await doc.insert()
    return doc
