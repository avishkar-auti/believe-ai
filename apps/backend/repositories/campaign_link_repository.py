"""Beanie-backed access to CampaignLink — the per-destination-URL identity
that per-link click analytics count against."""

from __future__ import annotations

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from models.campaign_link import CampaignLink, LinkCategory
from services.link_classification import classify_link


async def get_or_create(campaign_id: ObjectId, user_id: ObjectId, url: str, anchor_text: str = "") -> CampaignLink:
    """Concurrent sends for the same campaign can race to create the first
    row for a given URL — the unique (campaignId, url) index makes that safe:
    on a lost race we just re-fetch the winner instead of erroring."""
    existing = await CampaignLink.find_one(CampaignLink.campaignId == campaign_id, CampaignLink.url == url)
    if existing:
        return existing
    doc = CampaignLink(campaignId=campaign_id, userId=user_id, url=url, category=classify_link(url, anchor_text), label=anchor_text or None)
    try:
        await doc.insert()
        return doc
    except DuplicateKeyError:
        winner = await CampaignLink.find_one(CampaignLink.campaignId == campaign_id, CampaignLink.url == url)
        assert winner is not None
        return winner


async def find_by_id(link_id: ObjectId) -> CampaignLink | None:
    return await CampaignLink.get(link_id)


async def increment_click(link_id: ObjectId) -> None:
    collection = CampaignLink.get_pymongo_collection()
    await collection.update_one({"_id": link_id}, {"$inc": {"clickCount": 1}})


async def list_for_campaign(campaign_id: ObjectId) -> list[CampaignLink]:
    return await CampaignLink.find(CampaignLink.campaignId == campaign_id).sort("-clickCount").to_list()


async def category_breakdown(campaign_id: ObjectId) -> dict[LinkCategory, int]:
    links = await list_for_campaign(campaign_id)
    breakdown: dict[LinkCategory, int] = {}
    for link in links:
        breakdown[link.category] = breakdown.get(link.category, 0) + link.clickCount
    return breakdown
