from __future__ import annotations

from bson import ObjectId

from models.note_attachment import NoteAttachment


async def create(note_id: ObjectId, user_id: ObjectId, filename: str, content_type: str, data: bytes) -> NoteAttachment:
    doc = NoteAttachment(noteId=note_id, userId=user_id, filename=filename, contentType=content_type, data=data)
    await doc.insert()
    return doc


async def find_by_id(attachment_id: ObjectId, user_id: ObjectId) -> NoteAttachment | None:
    return await NoteAttachment.find_one(NoteAttachment.id == attachment_id, NoteAttachment.userId == user_id)


async def list_by_note(note_id: ObjectId, user_id: ObjectId) -> list[NoteAttachment]:
    return await NoteAttachment.find(NoteAttachment.noteId == note_id, NoteAttachment.userId == user_id).to_list()
