"""API-facing shape for audit log entries — mirrors packages/shared's
AuditLog type. See models/audit_log.py for the persisted Beanie Document
this is derived from."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from models.audit_log import AuditAction


class AuditLogDto(BaseModel):
    id: str
    userId: str
    action: AuditAction
    entityType: str
    entityId: str | None
    metadata: dict[str, Any]
    ip: str | None
    userAgent: str | None
    createdAt: str
