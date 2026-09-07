"""Beanie-backed campaign access — mirrors apps/api's campaign.repository.ts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from models.campaign import Campaign, CampaignStatus


async def list_for_user(user_id: ObjectId, status: CampaignStatus | None = None) -> list[Campaign]:
    filter_: dict[str, Any] = {"userId": user_id}
    if status:
        filter_["status"] = status
    return await Campaign.find(filter_).sort("-createdAt").to_list()


async def find_by_id(campaign_id: ObjectId, user_id: ObjectId) -> Campaign | None:
    return await Campaign.find_one(Campaign.id == campaign_id, Campaign.userId == user_id)


async def create(user_id: ObjectId, data: dict[str, Any]) -> Campaign:
    doc = Campaign(userId=user_id, status="DRAFT", **data)
    await doc.insert()
    return doc


async def update(campaign_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Campaign | None:
    doc = await find_by_id(campaign_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def set_status(campaign_id: ObjectId, user_id: ObjectId, status: CampaignStatus) -> Campaign | None:
    doc = await find_by_id(campaign_id, user_id)
    if not doc:
        return None
    doc.status = status
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def count_by_user_id(user_id: ObjectId) -> int:
    return await Campaign.find(Campaign.userId == user_id).count()


async def delete(campaign_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(campaign_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
