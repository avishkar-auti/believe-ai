"""API-facing shape for in-app notifications — mirrors packages/shared's
Notification type. See models/notification.py for the persisted Beanie
Document this is derived from."""

from __future__ import annotations

from pydantic import BaseModel

from models.notification import NotificationType
from schemas.pagination import PaginatedResult


class NotificationDto(BaseModel):
    id: str
    userId: str
    type: NotificationType
    title: str
    body: str
    link: str | None
    read: bool
    createdAt: str


class NotificationListResult(PaginatedResult[NotificationDto]):
    unread: int


class MarkAllReadResult(BaseModel):
    updated: int
