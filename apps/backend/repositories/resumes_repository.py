from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_primary_for_user(db: AsyncIOMotorDatabase, user_id: ObjectId) -> dict | None:
    """The resume every AI consumer defaults to when the caller doesn't ask
    for a specific one by id."""
    return await db["resumes"].find_one({"userId": user_id, "isPrimary": True})


async def find_by_id(db: AsyncIOMotorDatabase, user_id: ObjectId, resume_id: ObjectId) -> dict | None:
    return await db["resumes"].find_one({"_id": resume_id, "userId": user_id})


async def resolve_for_user(db: AsyncIOMotorDatabase, user_id: ObjectId, resume_id: ObjectId | None) -> dict | None:
    """The one call every consumer should make: a specific resume if the
    caller named one, else whichever is Primary."""
    if resume_id:
        return await find_by_id(db, user_id, resume_id)
    return await find_primary_for_user(db, user_id)
