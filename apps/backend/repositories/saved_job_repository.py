"""Beanie-backed saved-job access — mirrors apps/api's savedJob.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.saved_job import JobSnapshot, SavedJob


async def saved_job_ids(user_id: ObjectId) -> set[str]:
    """Ids of every job this user has saved — used to annotate search results with isSaved."""
    docs = await SavedJob.find(SavedJob.userId == user_id).to_list()
    return {doc.jobId for doc in docs}


async def find(user_id: ObjectId, job_id: str) -> SavedJob | None:
    return await SavedJob.find_one(SavedJob.userId == user_id, SavedJob.jobId == job_id)


async def save(user_id: ObjectId, job_id: str, snapshot: JobSnapshot) -> SavedJob:
    doc = SavedJob(userId=user_id, jobId=job_id, snapshot=snapshot)
    await doc.insert()
    return doc


async def unsave(user_id: ObjectId, job_id: str) -> None:
    await SavedJob.find(SavedJob.userId == user_id, SavedJob.jobId == job_id).delete()


async def list_by_user(user_id: ObjectId) -> list[SavedJob]:
    return await SavedJob.find(SavedJob.userId == user_id).sort("-createdAt").to_list()
