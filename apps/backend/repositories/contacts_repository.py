from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_id_scoped(db: AsyncIOMotorDatabase, contact_id: ObjectId, user_id: ObjectId) -> dict | None:
    return await db["contacts"].find_one({"_id": contact_id, "userId": user_id})
