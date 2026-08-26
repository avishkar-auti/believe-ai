"""Beanie-backed access to persisted Roadmaps — mirrors apps/api's
roadmap.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.roadmap import Roadmap, RoadmapStage


async def create(user_id: ObjectId, goal: str, detected_skills: list[str], stages: list[RoadmapStage]) -> Roadmap:
    doc = Roadmap(userId=user_id, goal=goal, detectedSkills=detected_skills, stages=stages)
    await doc.insert()
    return doc


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[Roadmap], int]:
    skip = (page - 1) * limit
    items = await Roadmap.find(Roadmap.userId == user_id).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await Roadmap.find(Roadmap.userId == user_id).count()
    return items, total


async def find_by_id(roadmap_id: ObjectId, user_id: ObjectId) -> Roadmap | None:
    return await Roadmap.find_one(Roadmap.id == roadmap_id, Roadmap.userId == user_id)


async def delete(roadmap_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(roadmap_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
