"""Beanie-backed audit log access — the sole writer of audit entries. Every
action that records one (campaigns, contacts, integrations, job outreach,
templates) calls services/audit_service.py, which calls create() here."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from models.audit_log import AuditAction, AuditLog


async def create(
    user_id: ObjectId,
    action: AuditAction,
    entity_type: str,
    entity_id: str | None,
    metadata: dict[str, Any],
    ip: str | None,
    user_agent: str | None,
) -> None:
    await AuditLog(
        userId=user_id,
        action=action,
        entityType=entity_type,
        entityId=entity_id,
        metadata=metadata,
        ip=ip,
        userAgent=user_agent,
    ).insert()


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[AuditLog], int]:
    skip = (page - 1) * limit
    query = AuditLog.find(AuditLog.userId == user_id)
    # String-based sort ("-field") sidesteps a real gap in Beanie's type
    # stubs for `-Document.field` (works fine at runtime, mypy can't verify it).
    items = await query.sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await query.count()
    return items, total
