"""Beanie-backed outreach send log access — mirrors apps/api's outreachSendLog.repository.ts."""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from models.outreach_send_log import OutreachSendChannel, OutreachSendContentType, OutreachSendLog, OutreachSendStatus


async def create(
    user_id: ObjectId,
    outreach_draft_id: ObjectId,
    contact_id: ObjectId,
    channel: OutreachSendChannel,
    status: OutreachSendStatus,
    content_type: OutreachSendContentType | None,
    sent_at: datetime | None = None,
    error_message: str | None = None,
    provider_message_id: str | None = None,
) -> OutreachSendLog:
    doc = OutreachSendLog(
        userId=user_id,
        outreachDraftId=outreach_draft_id,
        contactId=contact_id,
        channel=channel,
        status=status,
        contentType=content_type,
        sentAt=sent_at,
        errorMessage=error_message,
        providerMessageId=provider_message_id,
    )
    await doc.insert()
    return doc


async def list_by_draft(outreach_draft_id: ObjectId, user_id: ObjectId) -> list[OutreachSendLog]:
    return (
        await OutreachSendLog.find(OutreachSendLog.outreachDraftId == outreach_draft_id, OutreachSendLog.userId == user_id)
        .sort("-createdAt")
        .to_list()
    )
