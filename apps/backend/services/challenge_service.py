"""AI Practice Lab — challenge search/detail. Hidden test cases never leave
this module: ChallengeDetailDto has no testCases field, and _to_detail_dto
builds `sampleTests` from only the non-hidden ones. Each challenge's
`status` ("unsolved" | "attempted" | "solved") is resolved per-request
against the caller's own progress — it isn't stored on Challenge, which is
global, shared content."""

from __future__ import annotations

from beanie import PydanticObjectId
from bson import ObjectId

from core.errors import NotFoundError
from models.practice_challenge import Challenge, ChallengeDifficulty, ChallengeTrack, ChallengeType
from repositories import practice_challenge_repository, practice_progress_repository
from repositories.practice_challenge_repository import ChallengeSearchFilters
from schemas.pagination import PaginatedResult, safe_limit, safe_page, total_pages
from schemas.practice_challenge import (
    ChallengeDetailDto,
    ChallengeResourceDto,
    ChallengeStarterFileDto,
    ChallengeStatusFilter,
    ChallengeSummaryDto,
    SampleTestDto,
)


async def _attempt_status_map(user_id: ObjectId) -> dict[PydanticObjectId, bool]:
    """challengeId -> solved, for every challenge the user has ever submitted."""
    progress = await practice_progress_repository.find_by_user_id(user_id)
    return {a.challengeId: a.solved for a in progress.attempts} if progress else {}


def _resolve_status(challenge_id: PydanticObjectId | None, attempts: dict[PydanticObjectId, bool]) -> ChallengeStatusFilter:
    if challenge_id is None or challenge_id not in attempts:
        return "unsolved"
    return "solved" if attempts[challenge_id] else "attempted"


def _to_summary_dto(doc: Challenge, attempts: dict[PydanticObjectId, bool]) -> ChallengeSummaryDto:
    return ChallengeSummaryDto(
        id=str(doc.id),
        slug=doc.slug,
        title=doc.title,
        track=doc.track,
        difficulty=doc.difficulty,
        challengeType=doc.challengeType,
        summary=doc.summary,
        tags=doc.tags,
        estimatedMinutes=doc.estimatedMinutes,
        status=_resolve_status(doc.id, attempts),
    )


def _to_detail_dto(doc: Challenge, attempts: dict[PydanticObjectId, bool]) -> ChallengeDetailDto:
    summary = _to_summary_dto(doc, attempts)
    return ChallengeDetailDto(
        **summary.model_dump(),
        description=doc.description,
        starterFiles=[ChallengeStarterFileDto(path=f.path, content=f.content, readOnly=f.readOnly) for f in doc.starterFiles],
        sampleTests=[
            SampleTestDto(name=t.name, input=t.input, expectedOutput=t.expectedOutput) for t in doc.testCases if not t.hidden
        ],
        resources=[ChallengeResourceDto(title=r.title, url=r.url) for r in doc.resources],
    )


async def search_challenges(
    user_id: ObjectId,
    q: str | None,
    track: ChallengeTrack | None,
    difficulty: ChallengeDifficulty | None,
    challenge_type: ChallengeType | None,
    status: ChallengeStatusFilter | None,
    page: int,
    limit: int,
) -> PaginatedResult[ChallengeSummaryDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)

    filters = ChallengeSearchFilters(q=q, track=track, difficulty=difficulty, challengeType=challenge_type)
    docs = await practice_challenge_repository.search_all(filters)
    attempts = await _attempt_status_map(user_id)

    items = [_to_summary_dto(doc, attempts) for doc in docs]
    if status:
        items = [i for i in items if i.status == status]

    total = len(items)
    start = (safe_page_ - 1) * safe_limit_
    page_items = items[start : start + safe_limit_]
    return PaginatedResult[ChallengeSummaryDto](
        items=page_items, page=safe_page_, limit=safe_limit_, total=total, totalPages=total_pages(total, safe_limit_)
    )


async def get_by_slug(slug: str, user_id: ObjectId) -> ChallengeDetailDto:
    doc = await practice_challenge_repository.find_by_slug(slug)
    if not doc:
        raise NotFoundError("Challenge not found")
    attempts = await _attempt_status_map(user_id)
    return _to_detail_dto(doc, attempts)
