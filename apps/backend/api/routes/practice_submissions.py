"""AI Practice Lab — Submit is the only action that creates a persisted
resource; Run/Evaluate live in api/routes/practice_challenges.py."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, SettingsDep
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from schemas.practice_submission import CreateSubmissionInput, SubmissionDto
from services import submission_service

router = APIRouter(prefix="/practice/submissions", tags=["practice-submissions"])


@router.post("/", response_model=SubmissionDto, status_code=201)
async def create_submission_route(body: CreateSubmissionInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> SubmissionDto:
    return await submission_service.submit(settings, mongo_user_id, body.challengeId, body.files, body.language)


@router.get("/", response_model=PaginatedResult[SubmissionDto])
async def list_submissions_route(
    mongo_user_id: MongoUserIdDep, challengeId: PydanticObjectId | None = None, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[SubmissionDto]:
    return await submission_service.list_history(mongo_user_id, challengeId, page, limit)


@router.get("/{submission_id}", response_model=SubmissionDto)
async def get_submission_route(submission_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> SubmissionDto:
    return await submission_service.get_by_id(submission_id, mongo_user_id)
