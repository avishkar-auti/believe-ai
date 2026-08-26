"""API-facing shapes for outreach sending — mirrors packages/shared's
OutreachSendLog/OutreachFollowUp types."""

from __future__ import annotations

from pydantic import BaseModel

from models.outreach_send_log import OutreachSendChannel, OutreachSendContentType, OutreachSendStatus


class OutreachSendLogDto(BaseModel):
    id: str
    userId: str
    outreachDraftId: str
    contactId: str
    channel: OutreachSendChannel
    status: OutreachSendStatus
    contentType: OutreachSendContentType | None
    sentAt: str | None
    errorMessage: str | None
    createdAt: str


class OutreachFollowUpDto(BaseModel):
    id: str
    userId: str
    outreachDraftId: str
    contactId: str
    sequenceNumber: int
    scheduledFor: str
    sent: bool
    cancelled: bool
    cancelReason: str | None
    createdAt: str


class SendResult(BaseModel):
    sendLogs: list[OutreachSendLogDto]


class MarkRepliedResult(BaseModel):
    marked: bool
