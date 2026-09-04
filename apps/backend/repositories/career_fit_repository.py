"""Beanie-backed access to persisted Career Fit assessments — mirrors
apps/api's careerFit.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.career_fit import CareerFit


async def create(
    user_id: ObjectId,
    target_role: str | None,
    summary: str,
    strengths: list[str],
    skill_gaps: list[str],
    suggested_roles: list[str],
    fit_score: int,
) -> CareerFit:
    doc = CareerFit(
        userId=user_id,
        targetRole=target_role,
        summary=summary,
        strengths=strengths,
        skillGaps=skill_gaps,
        suggestedRoles=suggested_roles,
        fitScore=fit_score,
    )
    await doc.insert()
    return doc


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[CareerFit], int]:
    skip = (page - 1) * limit
    items = await CareerFit.find(CareerFit.userId == user_id).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await CareerFit.find(CareerFit.userId == user_id).count()
    return items, total


async def find_by_id(career_fit_id: ObjectId, user_id: ObjectId) -> CareerFit | None:
    return await CareerFit.find_one(CareerFit.id == career_fit_id, CareerFit.userId == user_id)


async def delete(career_fit_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(career_fit_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
