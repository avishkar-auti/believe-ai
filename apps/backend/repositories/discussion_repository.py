"""Beanie-backed discussion access — mirrors apps/api's discussion.repository.ts."""

from __future__ import annotations

from beanie import PydanticObjectId
from bson import ObjectId

from models.discussion import Discussion, DiscussionReply


async def list_discussions(page: int, limit: int) -> tuple[list[Discussion], int]:
    skip = (page - 1) * limit
    items = await Discussion.find().sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await Discussion.find().count()
    return items, total


async def find_by_id(discussion_id: ObjectId) -> Discussion | None:
    return await Discussion.get(discussion_id)


async def create(author_id: ObjectId, author_name: str, title: str, body: str) -> Discussion:
    doc = Discussion(authorId=author_id, authorName=author_name, title=title, body=body)
    await doc.insert()
    return doc


async def add_reply(discussion_id: ObjectId, author_id: ObjectId, author_name: str, body: str) -> Discussion | None:
    doc = await Discussion.get(discussion_id)
    if not doc:
        return None
    doc.replies.append(DiscussionReply(authorId=PydanticObjectId(author_id), authorName=author_name, body=body))
    await doc.save()
    return doc


async def toggle_upvote(discussion_id: ObjectId, user_id: ObjectId) -> Discussion | None:
    """Toggles in one atomic query — no read-then-write race between two
    concurrent clicks."""
    already_upvoted = await Discussion.find_one(Discussion.id == discussion_id, Discussion.upvotes == user_id).exists()
    collection = Discussion.get_pymongo_collection()
    update = {"$pull": {"upvotes": user_id}} if already_upvoted else {"$addToSet": {"upvotes": user_id}}
    await collection.update_one({"_id": discussion_id}, update)
    return await Discussion.get(discussion_id)


async def delete(discussion_id: ObjectId, author_id: ObjectId) -> bool:
    doc = await Discussion.find_one(Discussion.id == discussion_id, Discussion.authorId == author_id)
    if not doc:
        return False
    await doc.delete()
    return True
