"""Beanie-backed outreach draft access — mirrors apps/api's outreachDraft.repository.ts."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import PydanticObjectId
from bson import ObjectId

from models.outreach_draft import DraftStatus, OutreachDraft, OutreachDraftEditedText


async def create_many(records: list[OutreachDraft]) -> list[OutreachDraft]:
    if not records:
        return []
    # insert_many() converts each document to a plain dict before inserting and never
    # writes the generated _id back onto the original objects (unlike single .insert()) —
    # inserted_ids comes back in the same order as `records` for an ordered insert, so
    # zip them back on manually or every caller downstream sees doc.id as None.
    result = await OutreachDraft.insert_many(records)
    for record, inserted_id in zip(records, result.inserted_ids, strict=True):
        record.id = PydanticObjectId(inserted_id)
    return records


async def list_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> list[OutreachDraft]:
    return await OutreachDraft.find(OutreachDraft.jobIntelId == job_intel_id, OutreachDraft.userId == user_id).sort("-createdAt").to_list()


async def find_by_id(draft_id: ObjectId, user_id: ObjectId) -> OutreachDraft | None:
    return await OutreachDraft.find_one(OutreachDraft.id == draft_id, OutreachDraft.userId == user_id)


async def update_status(
    draft_id: ObjectId, user_id: ObjectId, status: DraftStatus, edited_text: OutreachDraftEditedText | None
) -> OutreachDraft | None:
    doc = await find_by_id(draft_id, user_id)
    if not doc:
        return None
    doc.status = status
    doc.editedText = edited_text
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc
