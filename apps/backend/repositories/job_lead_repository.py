"""Beanie-backed job lead access — mirrors apps/api's jobLead.repository.ts."""

from __future__ import annotations

from beanie import PydanticObjectId
from bson import ObjectId

from models.job_lead import JobLead


async def delete_unadded_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> None:
    """Only clears leads the user hasn't already promoted to a real Contact —
    a re-run of discovery should refresh stale suggestions, never orphan one
    that's already been added to the address book."""
    await JobLead.find(
        JobLead.jobIntelId == job_intel_id,
        JobLead.userId == user_id,
        JobLead.addedContactId == None,  # noqa: E711
    ).delete()


async def create_many(records: list[JobLead]) -> list[JobLead]:
    if not records:
        return []
    # insert_many() never writes the generated _id back onto the original objects —
    # see outreach_draft_repository.create_many for the full explanation.
    result = await JobLead.insert_many(records)
    for record, inserted_id in zip(records, result.inserted_ids, strict=True):
        record.id = PydanticObjectId(inserted_id)
    return records


async def list_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> list[JobLead]:
    return await JobLead.find(JobLead.jobIntelId == job_intel_id, JobLead.userId == user_id).sort("relevanceRank").to_list()


async def find_by_id(lead_id: ObjectId, user_id: ObjectId) -> JobLead | None:
    return await JobLead.find_one(JobLead.id == lead_id, JobLead.userId == user_id)


async def mark_added(lead_id: ObjectId, user_id: ObjectId, contact_id: ObjectId) -> JobLead | None:
    doc = await find_by_id(lead_id, user_id)
    if not doc:
        return None
    doc.addedContactId = contact_id  # type: ignore[assignment]
    await doc.save()
    return doc
