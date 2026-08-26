from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_user_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> dict | None:
    return await db["usercontexts"].find_one({"userId": user_id})
