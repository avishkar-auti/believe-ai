"""The one deliberately public read in this API — no auth dependency on its
route (api/routes/public_profile.py). A disabled or missing profile 404s
identically, so the response never leaks "this username exists but is
private" to an anonymous caller.
"""

from __future__ import annotations

from core.errors import NotFoundError
from repositories import skill_repository, user_repository
from schemas.user import PublicProfileDto


async def get_public_profile(username: str) -> PublicProfileDto:
    user = await user_repository.find_by_username(username.strip().lower())
    if not user or not user.publicProfileEnabled:
        raise NotFoundError("Profile not found")
    assert user.id is not None
    skills = await skill_repository.list_for_user(user.id)
    return PublicProfileDto(
        username=user.username or username,
        name=user.name,
        avatar=user.avatar,
        headline=user.headline,
        bio=user.bio,
        about=user.about,
        location=user.location,
        company=user.company,
        socialLinks=user.socialLinks,
        skills=[s.name for s in skills if s.featured],
        cardTheme=user.cardTheme,
    )
