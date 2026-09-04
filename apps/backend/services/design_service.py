"""Design Studio — generate a screen from a prompt, then edit it via full-DSL
regeneration. Mirrors note_service.py's shape: the AI call happens inline in
create/edit (no background job), and the resulting DSL is persisted as-is —
the frontend DesignRenderer, not this layer, validates node shapes.

Every screen belongs to a DesignProject (see design_project_service.py) and
is placed on a deterministic grid, scoped per-project, at creation time so
new screens never overlap existing ones regardless of where the user has
since dragged them around."""

from __future__ import annotations

from bson import ObjectId

from agents.design_agent import edit_design_screen, enhance_design_prompt, generate_design_screen
from core.config import Settings
from core.errors import NotFoundError
from models.design_screen import DesignScreen, DesignScreenPosition
from repositories import design_project_repository, design_screen_repository
from schemas.ai import DesignEditRequest, DesignGenerateRequest, DesignPromptEnhanceRequest
from schemas.design import (
    CreateDesignScreenInput,
    DesignScreenDto,
    DesignScreenPositionDto,
    DesignScreenSummaryDto,
    EditDesignScreenInput,
    EnhanceDesignPromptInput,
    EnhanceDesignPromptResult,
)

_CARD_W = 360
_CARD_H = 240
_GAP = 48
_COLS = 4


def _grid_position(index: int) -> DesignScreenPosition:
    col = index % _COLS
    row = index // _COLS
    return DesignScreenPosition(x=col * (_CARD_W + _GAP), y=row * (_CARD_H + _GAP))


def _to_position_dto(position: DesignScreenPosition) -> DesignScreenPositionDto:
    return DesignScreenPositionDto(x=position.x, y=position.y)


def _to_dto(doc: DesignScreen) -> DesignScreenDto:
    assert doc.id is not None
    return DesignScreenDto(
        id=str(doc.id),
        title=doc.title,
        prompt=doc.prompt,
        platform=doc.platform,
        dsl=doc.dsl,
        canvasPosition=_to_position_dto(doc.canvasPosition),
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _to_summary_dto(doc: DesignScreen) -> DesignScreenSummaryDto:
    assert doc.id is not None
    return DesignScreenSummaryDto(
        id=str(doc.id),
        title=doc.title,
        platform=doc.platform,
        dsl=doc.dsl,
        canvasPosition=_to_position_dto(doc.canvasPosition),
        updatedAt=doc.updatedAt.isoformat(),
    )


async def _require_project(project_id: ObjectId, user_id: ObjectId) -> None:
    project = await design_project_repository.find_by_id(project_id, user_id)
    if not project:
        raise NotFoundError("Design project not found")


async def create(settings: Settings, user_id: ObjectId, project_id: ObjectId, input_: CreateDesignScreenInput) -> DesignScreenDto:
    await _require_project(project_id, user_id)
    result = await generate_design_screen(settings, DesignGenerateRequest(prompt=input_.prompt, platform=input_.platform))
    existing_count = await design_screen_repository.count_by_project(project_id, user_id)
    position = _grid_position(existing_count)
    doc = await design_screen_repository.create(
        user_id, project_id, result.title, input_.prompt, input_.platform, result.dsl, position
    )
    await design_project_repository.touch(project_id, user_id)
    return _to_dto(doc)


async def list_for_project(user_id: ObjectId, project_id: ObjectId) -> list[DesignScreenSummaryDto]:
    await _require_project(project_id, user_id)
    docs = await design_screen_repository.list_by_project(project_id, user_id)
    return [_to_summary_dto(d) for d in docs]


async def get(screen_id: ObjectId, user_id: ObjectId) -> DesignScreenDto:
    doc = await design_screen_repository.find_by_id(screen_id, user_id)
    if not doc:
        raise NotFoundError("Design screen not found")
    return _to_dto(doc)


async def edit(settings: Settings, screen_id: ObjectId, user_id: ObjectId, input_: EditDesignScreenInput) -> DesignScreenDto:
    existing = await design_screen_repository.find_by_id(screen_id, user_id)
    if not existing:
        raise NotFoundError("Design screen not found")

    result = await edit_design_screen(settings, DesignEditRequest(currentDsl=existing.dsl, instruction=input_.instruction))
    updated = await design_screen_repository.update_dsl(screen_id, user_id, result.dsl)
    if not updated:
        raise NotFoundError("Design screen not found")
    if existing.projectId is not None:
        await design_project_repository.touch(existing.projectId, user_id)
    return _to_dto(updated)


async def update_position(screen_id: ObjectId, user_id: ObjectId, x: float, y: float) -> DesignScreenDto:
    updated = await design_screen_repository.update_position(screen_id, user_id, x, y)
    if not updated:
        raise NotFoundError("Design screen not found")
    return _to_dto(updated)


async def delete(screen_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await design_screen_repository.delete(screen_id, user_id)
    if not deleted:
        raise NotFoundError("Design screen not found")


async def enhance_prompt(settings: Settings, input_: EnhanceDesignPromptInput) -> EnhanceDesignPromptResult:
    result = await enhance_design_prompt(settings, DesignPromptEnhanceRequest(prompt=input_.prompt, platform=input_.platform))
    return EnhanceDesignPromptResult(enhancedPrompt=result.enhancedPrompt)
