from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_firebase_uid(db: AsyncIOMotorDatabase, firebase_uid: str) -> dict | None:
    return await db["users"].find_one({"firebaseUid": firebase_uid})


async def find_by_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> dict | None:
    return await db["users"].find_one({"_id": user_id})
