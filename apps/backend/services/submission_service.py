"""AI Practice Lab — Run/Evaluate are stateless previews against
ExecutionService and never touch MongoDB; only Submit persists a Submission
and updates practice progress. See services/execution_service.py for why.

Every action is rate-limited per user (core/rate_limit.py) — real sandbox
execution is a real, finite, spendable resource (this environment runs a
single lean Judge0 worker), and even the mock path shouldn't be hammerable
without limit."""

from __future__ import annotations

from bson import ObjectId

from core.config import Settings
from core.errors import NotFoundError
from core.rate_limit import enforce_rate_limit
from models.practice_submission import Submission
from repositories import practice_challenge_repository, practice_progress_repository, practice_submission_repository
from schemas.pagination import PaginatedResult, safe_limit, safe_page, total_pages
from schemas.practice_submission import ExecutionResultDto, SubmissionDto, SubmissionTestResultDto
from services.execution_service import get_execution_service

_WINDOW_SECONDS = 60 * 60
# Run is graded against public tests only (cheaper), so it gets a bit more
# headroom than Evaluate/Submit, which both grade the full suite.
_RUN_LIMIT_PER_HOUR = 30
_EVALUATE_LIMIT_PER_HOUR = 20
_SUBMIT_LIMIT_PER_HOUR = 20


async def run(settings: Settings, user_id: ObjectId, slug: str, files: dict[str, str], language: str) -> ExecutionResultDto:
    await enforce_rate_limit("practice_run", str(user_id), _RUN_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    challenge = await practice_challenge_repository.find_by_slug(slug)
    if not challenge:
        raise NotFoundError("Challenge not found")
    return await get_execution_service(settings).run(challenge, files, language)


async def evaluate(settings: Settings, user_id: ObjectId, slug: str, files: dict[str, str], language: str) -> ExecutionResultDto:
    await enforce_rate_limit("practice_evaluate", str(user_id), _EVALUATE_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    challenge = await practice_challenge_repository.find_by_slug(slug)
    if not challenge:
        raise NotFoundError("Challenge not found")
    return await get_execution_service(settings).evaluate(challenge, files, language)


def _to_submission_dto(doc: Submission) -> SubmissionDto:
    return SubmissionDto(
        id=str(doc.id),
        challengeId=str(doc.challengeId),
        files=doc.files,
        language=doc.language,
        engine=doc.engine,
        executed=doc.executed,
        stdout=doc.stdout,
        stderr=doc.stderr,
        testResults=[
            SubmissionTestResultDto(testCaseId=t.testCaseId, name=t.name, hidden=t.hidden, outcome=t.outcome)
            for t in doc.testResults
        ],
        totalCount=doc.totalCount,
        solved=doc.solved,
        message=doc.message,
        createdAt=doc.createdAt.isoformat(),
    )


def _is_fully_solved(result: ExecutionResultDto) -> bool:
    """True only for a real, fully-passing run — never for a mock preview
    (executed=False) or a challenge with no gradable tests at all."""
    return result.executed and result.totalCount > 0 and all(t.outcome == "passed" for t in result.testResults)


async def submit(
    settings: Settings, user_id: ObjectId, challenge_id: ObjectId, files: dict[str, str], language: str
) -> SubmissionDto:
    await enforce_rate_limit("practice_submit", str(user_id), _SUBMIT_LIMIT_PER_HOUR, _WINDOW_SECONDS)
    challenge = await practice_challenge_repository.find_by_id(challenge_id)
    if not challenge:
        raise NotFoundError("Challenge not found")

    result = await get_execution_service(settings).submit(challenge, files, language)
    solved = _is_fully_solved(result)
    doc = await practice_submission_repository.create(user_id, challenge_id, files, language, result, solved)
    await practice_progress_repository.record_submission(user_id, challenge_id, solved)
    return _to_submission_dto(doc)


async def list_history(user_id: ObjectId, challenge_id: ObjectId | None, page: int, limit: int) -> PaginatedResult[SubmissionDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    docs, total = await practice_submission_repository.list_for_user(user_id, challenge_id, safe_page_, safe_limit_)
    return PaginatedResult[SubmissionDto](
        items=[_to_submission_dto(d) for d in docs],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )


async def get_by_id(submission_id: ObjectId, user_id: ObjectId) -> SubmissionDto:
    doc = await practice_submission_repository.find_by_id(submission_id, user_id)
    if not doc:
        raise NotFoundError("Submission not found")
    return _to_submission_dto(doc)
