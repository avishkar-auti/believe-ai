"""Beanie-backed access to the caller's own resumes (metadata + raw files) —
mirrors apps/api's resume.repository.ts, extended for many-resumes-per-user
with one flagged `isPrimary`."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.resume import Resume, ResumeChunk, ResumeFile


async def list_for_user(user_id: ObjectId) -> list[Resume]:
    return await Resume.find(Resume.userId == user_id).sort("-createdAt").to_list()


async def find_by_id(user_id: ObjectId, resume_id: ObjectId) -> Resume | None:
    return await Resume.find_one(Resume.id == resume_id, Resume.userId == user_id)


async def find_primary_for_user(user_id: ObjectId) -> Resume | None:
    return await Resume.find_one(Resume.userId == user_id, Resume.isPrimary == True)  # noqa: E712


async def create(
    user_id: ObjectId,
    file_name: str,
    mime_type: str,
    size_bytes: int,
    content: str,
    chunks: list[ResumeChunk],
    target_role: str | None,
) -> Resume:
    # The very first resume a user uploads becomes Primary automatically;
    # every later one starts off not-Primary until explicitly set.
    is_first = await Resume.find(Resume.userId == user_id).count() == 0
    doc = Resume(
        userId=user_id,
        fileName=file_name,
        mimeType=mime_type,
        sizeBytes=size_bytes,
        content=content,
        chunks=chunks,
        isPrimary=is_first,
        targetRole=target_role,
    )
    await doc.insert()
    return doc


async def set_primary(user_id: ObjectId, resume_id: ObjectId) -> Resume | None:
    target = await find_by_id(user_id, resume_id)
    if not target:
        return None
    others = await Resume.find(Resume.userId == user_id, Resume.isPrimary == True).to_list()  # noqa: E712
    for other in others:
        if other.id != target.id:
            other.isPrimary = False
            await other.save()
    target.isPrimary = True
    target.updatedAt = datetime.now(UTC)
    await target.save()
    return target


async def update(user_id: ObjectId, resume_id: ObjectId, target_role: str | None) -> Resume | None:
    doc = await find_by_id(user_id, resume_id)
    if not doc:
        return None
    doc.targetRole = target_role
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def set_chunk_vectors(user_id: ObjectId, resume_id: ObjectId, vectors: list[list[float] | None]) -> Resume | None:
    """Each vector lines up with the chunk at the same index that was embedded."""
    doc = await find_by_id(user_id, resume_id)
    if not doc:
        return None
    for i, vector in enumerate(vectors):
        if i < len(doc.chunks):
            doc.chunks[i].vector = vector
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete_by_id(user_id: ObjectId, resume_id: ObjectId) -> bool:
    doc = await find_by_id(user_id, resume_id)
    if not doc:
        return False
    was_primary = doc.isPrimary

    resume_file = await ResumeFile.find_one(ResumeFile.resumeId == resume_id)
    await doc.delete()
    if resume_file:
        await resume_file.delete()

    if was_primary:
        # Promote the most recently created remaining resume, if any, so a
        # user with >=1 resume always has exactly one Primary.
        next_primary = await Resume.find(Resume.userId == user_id).sort("-createdAt").first_or_none()
        if next_primary:
            next_primary.isPrimary = True
            await next_primary.save()
    return True


async def create_file(resume_id: ObjectId, user_id: ObjectId, file_name: str, mime_type: str, data: bytes) -> ResumeFile:
    doc = ResumeFile(resumeId=resume_id, userId=user_id, fileName=file_name, mimeType=mime_type, data=data)
    await doc.insert()
    return doc


async def find_file_by_resume_id(resume_id: ObjectId) -> ResumeFile | None:
    return await ResumeFile.find_one(ResumeFile.resumeId == resume_id)
