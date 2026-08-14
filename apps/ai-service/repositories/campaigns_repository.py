from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_id_scoped(db: AsyncIOMotorDatabase, campaign_id: ObjectId, user_id: ObjectId) -> dict | None:
    """Every query is scoped by userId — a campaign_id alone is never enough (spec 21)."""
    return await db["campaigns"].find_one({"_id": campaign_id, "userId": user_id})
