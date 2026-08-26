"""Beanie-backed notification access — the sole writer of notifications.
Every action that creates one as a side effect (campaign completion,
contacts import, integration disconnect, room summary ready) calls
services/notification_service.py, which calls create() here."""

from __future__ import annotations

from bson import ObjectId

from models.notification import Notification, NotificationType


async def create(user_id: ObjectId, type_: NotificationType, title: str, body: str, link: str | None) -> None:
    await Notification(userId=user_id, type=type_, title=title, body=body, link=link).insert()


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[Notification], int]:
    skip = (page - 1) * limit
    query = Notification.find(Notification.userId == user_id)
    # String-based sort ("-field") sidesteps a real gap in Beanie's type
    # stubs for `-Document.field` (works fine at runtime, mypy can't verify it).
    items = await query.sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await query.count()
    return items, total


async def count_unread(user_id: ObjectId) -> int:
    return await Notification.find(Notification.userId == user_id, Notification.read == False).count()  # noqa: E712


async def mark_read(notification_id: ObjectId, user_id: ObjectId) -> Notification | None:
    notification = await Notification.find_one(Notification.id == notification_id, Notification.userId == user_id)
    if not notification:
        return None
    notification.read = True
    await notification.save()
    return notification


async def mark_all_read(user_id: ObjectId) -> int:
    # Raw pymongo update_many (not Beanie's higher-level .set()) for a
    # well-known, stable UpdateResult.modified_count return value.
    collection = Notification.get_pymongo_collection()
    result = await collection.update_many({"userId": user_id, "read": False}, {"$set": {"read": True}})
    return result.modified_count
