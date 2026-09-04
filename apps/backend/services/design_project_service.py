from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from models.design_project import DesignProject
from repositories import design_project_repository, design_screen_repository
from schemas.design import CreateDesignProjectInput, DesignProjectDto, UpdateDesignProjectInput


async def _to_dto(doc: DesignProject) -> DesignProjectDto:
    assert doc.id is not None
    screen_count = await design_screen_repository.count_by_project(doc.id, doc.userId)
    latest_screen = await design_screen_repository.find_latest_by_project(doc.id, doc.userId)
    return DesignProjectDto(
        id=str(doc.id),
        name=doc.name,
        screenCount=screen_count,
        previewDsl=latest_screen.dsl if latest_screen else None,
        previewPlatform=latest_screen.platform if latest_screen else None,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


async def create(user_id: ObjectId, input_: CreateDesignProjectInput) -> DesignProjectDto:
    doc = await design_project_repository.create(user_id, input_.name)
    return await _to_dto(doc)


async def list_for_user(user_id: ObjectId) -> list[DesignProjectDto]:
    docs = await design_project_repository.list_by_user(user_id)
    return [await _to_dto(d) for d in docs]


async def get(project_id: ObjectId, user_id: ObjectId) -> DesignProjectDto:
    doc = await design_project_repository.find_by_id(project_id, user_id)
    if not doc:
        raise NotFoundError("Design project not found")
    return await _to_dto(doc)


async def delete(project_id: ObjectId, user_id: ObjectId) -> None:
    doc = await design_project_repository.find_by_id(project_id, user_id)
    if not doc:
        raise NotFoundError("Design project not found")
    await design_screen_repository.delete_by_project(project_id, user_id)
    await design_project_repository.delete(project_id, user_id)


async def rename(project_id: ObjectId, user_id: ObjectId, input_: UpdateDesignProjectInput) -> DesignProjectDto:
    doc = await design_project_repository.rename(project_id, user_id, input_.name.strip())
    if not doc:
        raise NotFoundError("Design project not found")
    return await _to_dto(doc)


async def duplicate(project_id: ObjectId, user_id: ObjectId) -> DesignProjectDto:
    original = await design_project_repository.find_by_id(project_id, user_id)
    if not original:
        raise NotFoundError("Design project not found")

    copy = await design_project_repository.create(user_id, f"{original.name} (copy)")
    assert copy.id is not None
    screens = await design_screen_repository.list_by_project(project_id, user_id)
    for screen in screens:
        await design_screen_repository.create(
            user_id, copy.id, screen.title, screen.prompt, screen.platform, screen.dsl, screen.canvasPosition
        )
    return await _to_dto(copy)
