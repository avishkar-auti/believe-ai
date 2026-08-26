"""Believe Profile — optional per-user context fed automatically into every
AI call that benefits from sender context."""

from __future__ import annotations

from bson import ObjectId

from models.user_context import UserContext
from repositories import user_context_repository
from schemas.user_context import UpdateUserContextInput, UserContextDto


def _to_dto(doc: UserContext) -> UserContextDto:
    return UserContextDto(
        userId=str(doc.userId),
        aboutMe=doc.aboutMe,
        companyInfo=doc.companyInfo,
        servicesOrProducts=doc.servicesOrProducts,
        skillsAndExperience=doc.skillsAndExperience,
        achievements=doc.achievements,
        targetAudience=doc.targetAudience,
        updatedAt=doc.updatedAt.isoformat(),
    )


async def get_user_context(user_id: ObjectId) -> UserContextDto | None:
    """Returns None rather than a not-found error — a Believe Profile is optional."""
    doc = await user_context_repository.find_by_user_id(user_id)
    return _to_dto(doc) if doc else None


async def update_user_context(user_id: ObjectId, updates: UpdateUserContextInput) -> UserContextDto:
    doc = await user_context_repository.upsert(user_id, updates)
    return _to_dto(doc)
