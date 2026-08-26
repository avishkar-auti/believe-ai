from __future__ import annotations

from bson import ObjectId

from models.note_folder import NoteFolder


async def create(user_id: ObjectId, name: str) -> NoteFolder:
    doc = NoteFolder(userId=user_id, name=name)
    await doc.insert()
    return doc


async def list_by_user(user_id: ObjectId) -> list[NoteFolder]:
    return await NoteFolder.find(NoteFolder.userId == user_id).sort("name").to_list()


async def delete(folder_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await NoteFolder.find_one(NoteFolder.id == folder_id, NoteFolder.userId == user_id)
    if not doc:
        return False
    await doc.delete()
    return True
