"""Profile > Projects — mirrors services/experience_service.py's shape."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.portfolio_project import PortfolioProject
from repositories import portfolio_project_repository
from schemas.portfolio_project import CreatePortfolioProjectInput, PortfolioProjectDto, UpdatePortfolioProjectInput


def _to_dto(doc: PortfolioProject) -> PortfolioProjectDto:
    return PortfolioProjectDto(
        id=str(doc.id),
        name=doc.name,
        description=doc.description,
        technologies=doc.technologies,
        githubUrl=doc.githubUrl,
        liveUrl=doc.liveUrl,
        startDate=doc.startDate,
        endDate=doc.endDate,
        isCurrent=doc.isCurrent,
        order=doc.order,
    )


async def list_items(user_id: ObjectId) -> list[PortfolioProjectDto]:
    docs = await portfolio_project_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreatePortfolioProjectInput) -> PortfolioProjectDto:
    doc = await portfolio_project_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(project_id: ObjectId, user_id: ObjectId, input_: UpdatePortfolioProjectInput) -> PortfolioProjectDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await portfolio_project_repository.update(project_id, user_id, updates)
    if not doc:
        raise NotFoundError("Project not found")
    return _to_dto(doc)


async def delete(project_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await portfolio_project_repository.delete(project_id, user_id)
    if not deleted:
        raise NotFoundError("Project not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[PortfolioProjectDto]:
    docs = await portfolio_project_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
