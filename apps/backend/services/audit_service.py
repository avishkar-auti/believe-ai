"""Audit trail — reads the caller's own entries; record() is exposed for
future ports of the actions that produce them (see repositories/audit_repository.py)."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.logging import get_logger
from models.audit_log import AuditAction, AuditLog
from repositories import audit_repository
from schemas.audit import AuditLogDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages

logger = get_logger(__name__)


def _to_dto(doc: AuditLog) -> AuditLogDto:
    return AuditLogDto(
        id=str(doc.id),
        userId=str(doc.userId),
        action=doc.action,
        entityType=doc.entityType,
        entityId=doc.entityId,
        metadata=doc.metadata,
        ip=doc.ip,
        userAgent=doc.userAgent,
        createdAt=doc.createdAt.isoformat(),
    )


async def record(
    user_id: ObjectId,
    action: AuditAction,
    entity_type: str,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Deliberately swallows its own failures: an audit write must never
    break the user action it's describing (same contract as Node's
    auditService.record)."""
    try:
        await audit_repository.create(user_id, action, entity_type, entity_id, metadata or {}, ip, user_agent)
    except Exception as err:  # noqa: BLE001 — deliberately broad, see docstring
        logger.error("Failed to write audit log for action %s: %s", action, err)


async def list_audit_logs(
    user_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[AuditLogDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    items, total = await audit_repository.list_for_user(user_id, safe_page_, safe_limit_)
    return PaginatedResult[AuditLogDto](
        items=[_to_dto(doc) for doc in items],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )
