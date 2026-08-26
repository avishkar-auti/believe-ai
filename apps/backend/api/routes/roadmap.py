"""Mirrors apps/api's roadmap.routes.ts."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from schemas.roadmap import GenerateRoadmapInput, RoadmapDto
from services import roadmap_service

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])


@router.get("/", response_model=PaginatedResult[RoadmapDto])
async def list_roadmaps_route(mongo_user_id: MongoUserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE) -> PaginatedResult[RoadmapDto]:
    return await roadmap_service.list_roadmaps(mongo_user_id, page, limit)


@router.post("/", response_model=RoadmapDto, status_code=201)
async def generate_roadmap_route(
    body: GenerateRoadmapInput, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> RoadmapDto:
    return await roadmap_service.generate_and_save(settings, db, mongo_user_id, body.goal, body.personalize)


@router.get("/{roadmap_id}", response_model=RoadmapDto)
async def get_roadmap_route(roadmap_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> RoadmapDto:
    return await roadmap_service.get_roadmap(roadmap_id, mongo_user_id)


@router.delete("/{roadmap_id}")
async def delete_roadmap_route(roadmap_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await roadmap_service.delete_roadmap(roadmap_id, mongo_user_id)
    return {"deleted": True}
