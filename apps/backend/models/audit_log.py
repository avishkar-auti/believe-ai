"""Mirrors packages/server/src/models/AuditLog.model.ts — same "auditlogs"
collection. metadata holds only non-sensitive descriptors (names, counts) —
never credentials, tokens, or email content (spec 29's "do not log" list,
carried over unchanged)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

AuditAction = Literal[
    "campaign.created",
    "campaign.launched",
    "campaign.paused",
    "campaign.resumed",
    "campaign.cancelled",
    "campaign.deleted",
    "contacts.imported",
    "template.deleted",
    "integration.connected",
    "integration.disconnected",
    "job.created",
    "job.updated",
    "job.deleted",
    "job_intel.analyzed",
    "outreach_draft.generated",
    "outreach_draft.decided",
    "outreach_draft.sent",
    "outreach_draft.replied",
    "job_lead.discovered",
    "job_lead.added_to_contact",
]


class AuditLog(Document):
    userId: PydanticObjectId
    action: AuditAction
    entityType: str
    entityId: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    ip: str | None = None
    userAgent: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "auditlogs"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
