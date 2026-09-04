"""Profile > Projects — mirrors api/routes/profile_experience.py's shape."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.portfolio_project import CreatePortfolioProjectInput, PortfolioProjectDto, UpdatePortfolioProjectInput
from schemas.profile_common import ReorderInput
from services import portfolio_project_service

router = APIRouter(prefix="/profile/projects", tags=["profile"])


@router.get("/", response_model=list[PortfolioProjectDto])
async def list_projects_route(mongo_user_id: MongoUserIdDep) -> list[PortfolioProjectDto]:
    return await portfolio_project_service.list_items(mongo_user_id)


@router.post("/", response_model=PortfolioProjectDto, status_code=201)
async def create_project_route(body: CreatePortfolioProjectInput, mongo_user_id: MongoUserIdDep) -> PortfolioProjectDto:
    return await portfolio_project_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[PortfolioProjectDto])
async def reorder_projects_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[PortfolioProjectDto]:
    return await portfolio_project_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{project_id}", response_model=PortfolioProjectDto)
async def update_project_route(
    project_id: PydanticObjectId, body: UpdatePortfolioProjectInput, mongo_user_id: MongoUserIdDep
) -> PortfolioProjectDto:
    return await portfolio_project_service.update(project_id, mongo_user_id, body)


@router.delete("/{project_id}")
async def delete_project_route(project_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await portfolio_project_service.delete(project_id, mongo_user_id)
    return {"deleted": True}
