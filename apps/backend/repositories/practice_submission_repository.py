"""Beanie-backed submission access — a Submission is created only by the
Submit action; Run/Evaluate are stateless (see services/execution_service.py)."""

from __future__ import annotations

from bson import ObjectId

from models.practice_submission import Submission, SubmissionTestResult
from schemas.practice_submission import ExecutionResultDto


async def create(
    user_id: ObjectId, challenge_id: ObjectId, files: dict[str, str], language: str, execution: ExecutionResultDto, solved: bool
) -> Submission:
    doc = Submission(
        userId=user_id,
        challengeId=challenge_id,
        files=files,
        language=language,
        engine=execution.engine,
        executed=execution.executed,
        stdout=execution.stdout,
        stderr=execution.stderr,
        testResults=[
            SubmissionTestResult(testCaseId=t.testCaseId, name=t.name, hidden=t.hidden, outcome=t.outcome)
            for t in execution.testResults
        ],
        totalCount=execution.totalCount,
        solved=solved,
        message=execution.message,
    )
    await doc.insert()
    return doc


async def list_for_user(user_id: ObjectId, challenge_id: ObjectId | None, page: int, limit: int) -> tuple[list[Submission], int]:
    conditions = [Submission.userId == user_id]
    if challenge_id is not None:
        conditions.append(Submission.challengeId == challenge_id)
    skip = (page - 1) * limit
    items = await Submission.find(*conditions).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await Submission.find(*conditions).count()
    return items, total


async def find_by_id(submission_id: ObjectId, user_id: ObjectId) -> Submission | None:
    return await Submission.find_one(Submission.id == submission_id, Submission.userId == user_id)
