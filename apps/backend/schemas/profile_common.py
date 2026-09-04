"""Shape shared by every Profile-section resource's reorder endpoint
(Experience/Education/Skill/PortfolioProject/Certification/Achievement)."""

from __future__ import annotations

from pydantic import BaseModel


class ReorderInput(BaseModel):
    orderedIds: list[str]
