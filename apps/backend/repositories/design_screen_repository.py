"""Beanie-backed Design Studio access — same CRUD shape as repositories/note_repository.py."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from bson import ObjectId

from models.design_screen import DesignScreen, DesignScreenPosition


async def create(
    user_id: ObjectId,
    project_id: ObjectId,
    title: str,
    prompt: str,
    platform: Literal["web", "mobile"],
    dsl: dict[str, Any],
    canvas_position: DesignScreenPosition,
) -> DesignScreen:
    doc = DesignScreen(
        userId=user_id,
        projectId=project_id,
        title=title,
        prompt=prompt,
        platform=platform,
        dsl=dsl,
        canvasPosition=canvas_position,
    )
    await doc.insert()
    return doc


async def find_by_id(screen_id: ObjectId, user_id: ObjectId) -> DesignScreen | None:
    return await DesignScreen.find_one(DesignScreen.id == screen_id, DesignScreen.userId == user_id)


async def list_by_project(project_id: ObjectId, user_id: ObjectId) -> list[DesignScreen]:
    return await DesignScreen.find(DesignScreen.userId == user_id, DesignScreen.projectId == project_id).sort("-updatedAt").to_list()


async def count_by_project(project_id: ObjectId, user_id: ObjectId) -> int:
    return await DesignScreen.find(DesignScreen.userId == user_id, DesignScreen.projectId == project_id).count()


async def find_latest_by_project(project_id: ObjectId, user_id: ObjectId) -> DesignScreen | None:
    """The screen a project's dashboard card previews — most recently
    touched, same recency signal the project list itself sorts by."""
    return (
        await DesignScreen.find(DesignScreen.userId == user_id, DesignScreen.projectId == project_id)
        .sort("-updatedAt")
        .first_or_none()
    )


async def delete_by_project(project_id: ObjectId, user_id: ObjectId) -> None:
    await DesignScreen.find(DesignScreen.userId == user_id, DesignScreen.projectId == project_id).delete()


async def update_dsl(screen_id: ObjectId, user_id: ObjectId, dsl: dict[str, Any]) -> DesignScreen | None:
    doc = await find_by_id(screen_id, user_id)
    if not doc:
        return None
    doc.dsl = dsl
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def update_position(screen_id: ObjectId, user_id: ObjectId, x: float, y: float) -> DesignScreen | None:
    """Deliberately leaves updatedAt untouched — that field drives list_by_user's
    sort order, and dragging a card around a canvas isn't a meaningful edit."""
    doc = await find_by_id(screen_id, user_id)
    if not doc:
        return None
    doc.canvasPosition = DesignScreenPosition(x=x, y=y)
    await doc.save()
    return doc


async def delete(screen_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(screen_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
