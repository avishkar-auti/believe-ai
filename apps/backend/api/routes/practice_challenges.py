"""AI Practice Lab — challenge library + the stateless Run/Evaluate preview
actions (Submit lives in api/routes/practice_submissions.py, since it's the
only action that creates a persisted resource)."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, SettingsDep
from models.practice_challenge import ChallengeDifficulty, ChallengeTrack, ChallengeType
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from schemas.practice_challenge import ChallengeDetailDto, ChallengeStatusFilter, ChallengeSummaryDto
from schemas.practice_submission import ExecutionResultDto, RunSubmissionInput
from services import challenge_service, submission_service

router = APIRouter(prefix="/practice/challenges", tags=["practice-challenges"])


@router.get("/", response_model=PaginatedResult[ChallengeSummaryDto])
async def list_challenges_route(
    mongo_user_id: MongoUserIdDep,
    q: str | None = None,
    track: ChallengeTrack | None = None,
    difficulty: ChallengeDifficulty | None = None,
    challengeType: ChallengeType | None = None,
    status: ChallengeStatusFilter | None = None,
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
) -> PaginatedResult[ChallengeSummaryDto]:
    return await challenge_service.search_challenges(mongo_user_id, q, track, difficulty, challengeType, status, page, limit)


@router.get("/{slug}", response_model=ChallengeDetailDto)
async def get_challenge_route(slug: str, mongo_user_id: MongoUserIdDep) -> ChallengeDetailDto:
    return await challenge_service.get_by_slug(slug, mongo_user_id)


@router.post("/{slug}/run", response_model=ExecutionResultDto)
async def run_challenge_route(
    slug: str, body: RunSubmissionInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep
) -> ExecutionResultDto:
    return await submission_service.run(settings, mongo_user_id, slug, body.files, body.language)


@router.post("/{slug}/evaluate", response_model=ExecutionResultDto)
async def evaluate_challenge_route(
    slug: str, body: RunSubmissionInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep
) -> ExecutionResultDto:
    return await submission_service.evaluate(settings, mongo_user_id, slug, body.files, body.language)
