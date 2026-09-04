"""Beanie-backed practice-progress access — one document per user, upserted
on every submission, same shape as repositories/user_context_repository.py."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import PydanticObjectId
from bson import ObjectId

from models.practice_progress import ChallengeAttempt, UserPracticeProgress


async def find_by_user_id(user_id: ObjectId) -> UserPracticeProgress | None:
    return await UserPracticeProgress.find_one(UserPracticeProgress.userId == user_id)


async def record_submission(user_id: ObjectId, challenge_id: ObjectId, solved: bool) -> UserPracticeProgress:
    now = datetime.now(UTC)
    existing = await find_by_user_id(user_id)

    if not existing:
        doc = UserPracticeProgress(
            userId=user_id,
            challengesAttempted=1,
            challengesSolved=1 if solved else 0,
            totalSubmissions=1,
            attempts=[
                ChallengeAttempt(challengeId=PydanticObjectId(challenge_id), submissionCount=1, lastSubmittedAt=now, solved=solved)
            ],
            lastActivityAt=now,
            updatedAt=now,
        )
        await doc.insert()
        return doc

    attempt = next((a for a in existing.attempts if a.challengeId == challenge_id), None)
    if attempt:
        attempt.submissionCount += 1
        attempt.lastSubmittedAt = now
        # Once solved, stays solved — a later worse submission doesn't unsolve it.
        if solved and not attempt.solved:
            attempt.solved = True
            existing.challengesSolved += 1
    else:
        existing.attempts.append(
            ChallengeAttempt(challengeId=PydanticObjectId(challenge_id), submissionCount=1, lastSubmittedAt=now, solved=solved)
        )
        existing.challengesAttempted += 1
        if solved:
            existing.challengesSolved += 1

    existing.totalSubmissions += 1
    existing.lastActivityAt = now
    existing.updatedAt = now
    await existing.save()
    return existing
