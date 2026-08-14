from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_user_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> dict | None:
    """One resume per user — same singleton-per-user shape as user_contexts_repository."""
    return await db["resumes"].find_one({"userId": user_id})
