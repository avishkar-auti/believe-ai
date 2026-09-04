"""AI Practice Lab — thin read wrapper over practice_progress_repository;
writes happen inline in services/submission_service.py's submit()."""

from __future__ import annotations

from bson import ObjectId

from repositories import practice_progress_repository
from schemas.practice_progress import ChallengeAttemptDto, PracticeProgressDto


async def get_summary(user_id: ObjectId) -> PracticeProgressDto:
    doc = await practice_progress_repository.find_by_user_id(user_id)
    if not doc:
        return PracticeProgressDto(challengesAttempted=0, challengesSolved=0, totalSubmissions=0, attempts=[], lastActivityAt=None)

    return PracticeProgressDto(
        challengesAttempted=doc.challengesAttempted,
        challengesSolved=doc.challengesSolved,
        totalSubmissions=doc.totalSubmissions,
        attempts=[
            ChallengeAttemptDto(
                challengeId=str(a.challengeId),
                submissionCount=a.submissionCount,
                lastSubmittedAt=a.lastSubmittedAt.isoformat(),
                solved=a.solved,
            )
            for a in doc.attempts
        ],
        lastActivityAt=doc.lastActivityAt.isoformat() if doc.lastActivityAt else None,
    )
