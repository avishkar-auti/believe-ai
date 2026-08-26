"""Design Studio — projects (named workspaces), each owning a set of
screens generated from a prompt and edited via instruction. Every route is
scoped to the caller's own data via MongoUserIdDep, same as every other
authenticated resource."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, SettingsDep
from schemas.design import (
    CreateDesignProjectInput,
    CreateDesignScreenInput,
    DesignProjectDto,
    DesignScreenDto,
    DesignScreenSummaryDto,
    EditDesignScreenInput,
    UpdateDesignScreenPositionInput,
)
from services import design_project_service, design_service

router = APIRouter(prefix="/design", tags=["design"])


@router.get("/projects/", response_model=list[DesignProjectDto])
async def list_projects_route(mongo_user_id: MongoUserIdDep) -> list[DesignProjectDto]:
    return await design_project_service.list_for_user(mongo_user_id)


@router.post("/projects/", response_model=DesignProjectDto, status_code=201)
async def create_project_route(body: CreateDesignProjectInput, mongo_user_id: MongoUserIdDep) -> DesignProjectDto:
    return await design_project_service.create(mongo_user_id, body)


@router.get("/projects/{project_id}", response_model=DesignProjectDto)
async def get_project_route(project_id: str, mongo_user_id: MongoUserIdDep) -> DesignProjectDto:
    return await design_project_service.get(ObjectId(project_id), mongo_user_id)


@router.delete("/projects/{project_id}")
async def delete_project_route(project_id: str, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await design_project_service.delete(ObjectId(project_id), mongo_user_id)
    return {"deleted": True}


@router.get("/projects/{project_id}/screens/", response_model=list[DesignScreenSummaryDto])
async def list_screens_route(project_id: str, mongo_user_id: MongoUserIdDep) -> list[DesignScreenSummaryDto]:
    return await design_service.list_for_project(mongo_user_id, ObjectId(project_id))


@router.post("/projects/{project_id}/screens/", response_model=DesignScreenDto, status_code=201)
async def create_screen_route(
    project_id: str, body: CreateDesignScreenInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep
) -> DesignScreenDto:
    return await design_service.create(settings, mongo_user_id, ObjectId(project_id), body)


@router.get("/screens/{screen_id}", response_model=DesignScreenDto)
async def get_screen_route(screen_id: str, mongo_user_id: MongoUserIdDep) -> DesignScreenDto:
    return await design_service.get(ObjectId(screen_id), mongo_user_id)


@router.patch("/screens/{screen_id}", response_model=DesignScreenDto)
async def edit_screen_route(
    screen_id: str, body: EditDesignScreenInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep
) -> DesignScreenDto:
    return await design_service.edit(settings, ObjectId(screen_id), mongo_user_id, body)


@router.patch("/screens/{screen_id}/position", response_model=DesignScreenDto)
async def update_screen_position_route(
    screen_id: str, body: UpdateDesignScreenPositionInput, mongo_user_id: MongoUserIdDep
) -> DesignScreenDto:
    return await design_service.update_position(ObjectId(screen_id), mongo_user_id, body.x, body.y)


@router.delete("/screens/{screen_id}")
async def delete_screen_route(screen_id: str, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await design_service.delete(ObjectId(screen_id), mongo_user_id)
    return {"deleted": True}
