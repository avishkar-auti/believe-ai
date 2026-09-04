"""Beanie-backed challenge search — mirrors repositories/job_repository.py's
regex-$or + exact-match-clause query-building style. No pagination here:
the service layer needs the full matching set to resolve each challenge's
per-user status before paginating, so pagination happens after that."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from bson import ObjectId

from models.practice_challenge import Challenge, ChallengeDifficulty, ChallengeTrack, ChallengeType


@dataclass
class ChallengeSearchFilters:
    q: str | None = None
    track: ChallengeTrack | None = None
    difficulty: ChallengeDifficulty | None = None
    challengeType: ChallengeType | None = None


def _build_filter(filters: ChallengeSearchFilters) -> dict[str, Any]:
    clauses: list[dict[str, Any]] = [{"status": "published"}]

    if filters.q:
        pattern = re.compile(re.escape(filters.q), re.IGNORECASE)
        clauses.append({"$or": [{"title": pattern}, {"summary": pattern}, {"tags": pattern}]})
    if filters.track:
        clauses.append({"track": filters.track})
    if filters.difficulty:
        clauses.append({"difficulty": filters.difficulty})
    if filters.challengeType:
        clauses.append({"challengeType": filters.challengeType})

    return {"$and": clauses}


async def search_all(filters: ChallengeSearchFilters) -> list[Challenge]:
    return await Challenge.find(_build_filter(filters)).sort("order").to_list()


async def find_by_slug(slug: str) -> Challenge | None:
    return await Challenge.find_one(Challenge.slug == slug, Challenge.status == "published")


async def find_by_id(challenge_id: ObjectId) -> Challenge | None:
    return await Challenge.get(challenge_id)
