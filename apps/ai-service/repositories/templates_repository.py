from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_id_scoped(db: AsyncIOMotorDatabase, template_id: ObjectId, user_id: ObjectId) -> dict | None:
    return await db["templates"].find_one({"_id": template_id, "userId": user_id})
