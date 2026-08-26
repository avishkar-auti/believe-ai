from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def find_by_id(db: AsyncIOMotorDatabase, room_id: ObjectId) -> dict | None:
    """Reads the Node-owned MockInterviewRoom collection — read-only, same
    read-across-services shape as resumes_repository. Mongoose pluralizes the
    model name "MockInterviewRoom" to the collection "mockinterviewrooms"."""
    return await db["mockinterviewrooms"].find_one({"_id": room_id})


async def find_recent_ideas(db: AsyncIOMotorDatabase, room_id: ObjectId, limit: int = 15) -> list[dict]:
    """Reads the Node-owned RoomIdea collection — read-only. Mongoose
    pluralizes "RoomIdea" to "roomideas". Most recent first."""
    cursor = db["roomideas"].find({"roomId": room_id}).sort("createdAt", -1).limit(limit)
    return await cursor.to_list(length=limit)


async def find_recent_transcript(db: AsyncIOMotorDatabase, room_id: ObjectId, limit: int = 15) -> list[dict]:
    """Reads the Node-owned RoomTranscriptTurn collection — read-only.
    Mongoose pluralizes "RoomTranscriptTurn" to "roomtranscriptturns".
    Most recent first."""
    cursor = db["roomtranscriptturns"].find({"roomId": room_id}).sort("capturedAt", -1).limit(limit)
    return await cursor.to_list(length=limit)


# Post-call summary reads the full session rather than a rolling window — a
# generous cap (not a real limit for any realistic single-session room) just
# guards against an unbounded query, unlike find_recent_* above.
_FULL_SESSION_CAP = 2000


async def find_all_ideas(db: AsyncIOMotorDatabase, room_id: ObjectId) -> list[dict]:
    """All idea-board notes for the room, oldest first."""
    cursor = db["roomideas"].find({"roomId": room_id}).sort("createdAt", 1).limit(_FULL_SESSION_CAP)
    return await cursor.to_list(length=_FULL_SESSION_CAP)


async def find_all_feedback(db: AsyncIOMotorDatabase, room_id: ObjectId) -> list[dict]:
    """All peer feedback for the room, oldest first. Mongoose pluralizes
    "RoomFeedback" to "roomfeedbacks"."""
    cursor = db["roomfeedbacks"].find({"roomId": room_id}).sort("createdAt", 1).limit(_FULL_SESSION_CAP)
    return await cursor.to_list(length=_FULL_SESSION_CAP)


async def find_all_transcript(db: AsyncIOMotorDatabase, room_id: ObjectId) -> list[dict]:
    """All transcript turns for the room, oldest first."""
    cursor = db["roomtranscriptturns"].find({"roomId": room_id}).sort("capturedAt", 1).limit(_FULL_SESSION_CAP)
    return await cursor.to_list(length=_FULL_SESSION_CAP)
