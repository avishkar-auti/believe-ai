"""In-app notifications — reads/marks-read the caller's own notifications;
create() is exposed for future ports of the actions that trigger them
(see repositories/notification_repository.py)."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from core.logging import get_logger
from models.notification import Notification, NotificationType
from repositories import notification_repository
from schemas.notification import NotificationDto, NotificationListResult
from schemas.pagination import DEFAULT_PAGE_SIZE, safe_limit, safe_page, total_pages

logger = get_logger(__name__)


def _to_dto(doc: Notification) -> NotificationDto:
    return NotificationDto(
        id=str(doc.id),
        userId=str(doc.userId),
        type=doc.type,
        title=doc.title,
        body=doc.body,
        link=doc.link,
        read=doc.read,
        createdAt=doc.createdAt.isoformat(),
    )


async def create(user_id: ObjectId, type_: NotificationType, title: str, body: str, link: str | None = None) -> None:
    """A failed notification must never break the action that triggered it —
    same contract as Node's notificationService.create."""
    try:
        await notification_repository.create(user_id, type_, title, body, link)
    except Exception as err:  # noqa: BLE001 — deliberately broad, see docstring
        logger.error("Failed to create notification of type %s: %s", type_, err)


async def list_notifications(
    user_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> NotificationListResult:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    items, total = await notification_repository.list_for_user(user_id, safe_page_, safe_limit_)
    unread = await notification_repository.count_unread(user_id)
    return NotificationListResult(
        items=[_to_dto(doc) for doc in items],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
        unread=unread,
    )


async def mark_read(notification_id: ObjectId, user_id: ObjectId) -> NotificationDto:
    doc = await notification_repository.mark_read(notification_id, user_id)
    if not doc:
        raise NotFoundError("Notification not found")
    return _to_dto(doc)


async def mark_all_read(user_id: ObjectId) -> int:
    return await notification_repository.mark_all_read(user_id)
