from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.design_project import DesignProject


async def create(user_id: ObjectId, name: str) -> DesignProject:
    doc = DesignProject(userId=user_id, name=name)
    await doc.insert()
    return doc


async def find_by_id(project_id: ObjectId, user_id: ObjectId) -> DesignProject | None:
    return await DesignProject.find_one(DesignProject.id == project_id, DesignProject.userId == user_id)


async def list_by_user(user_id: ObjectId) -> list[DesignProject]:
    return await DesignProject.find(DesignProject.userId == user_id).sort("-updatedAt").to_list()


async def touch(project_id: ObjectId, user_id: ObjectId) -> None:
    doc = await find_by_id(project_id, user_id)
    if not doc:
        return
    doc.updatedAt = datetime.now(UTC)
    await doc.save()


async def rename(project_id: ObjectId, user_id: ObjectId, name: str) -> DesignProject | None:
    doc = await find_by_id(project_id, user_id)
    if not doc:
        return None
    doc.name = name
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(project_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(project_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
