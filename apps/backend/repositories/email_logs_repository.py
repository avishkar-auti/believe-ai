from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def aggregate_status_counts(db: AsyncIOMotorDatabase, campaign_id: ObjectId) -> dict[str, int]:
    """Mirrors emailLogRepository.aggregateByCampaign on the Node side."""
    cursor = db["emaillogs"].aggregate(
        [
            {"$match": {"campaignId": campaign_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
    )
    return {row["_id"]: row["count"] async for row in cursor}
