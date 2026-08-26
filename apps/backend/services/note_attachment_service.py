"""Note images/files — same size-cap discipline as resume_service.py's
_MAX_RESUME_BYTES, just a larger ceiling since these are inline editor
images, not one-per-note documents."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError, ValidationError
from models.note_attachment import NoteAttachment
from repositories import note_attachment_repository
from schemas.note import NoteAttachmentDto

_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024


def _to_dto(doc: NoteAttachment) -> NoteAttachmentDto:
    assert doc.id is not None
    return NoteAttachmentDto(
        id=str(doc.id), noteId=str(doc.noteId), filename=doc.filename, contentType=doc.contentType, createdAt=doc.createdAt.isoformat()
    )


async def upload(note_id: ObjectId, user_id: ObjectId, filename: str, content_type: str, data: bytes) -> NoteAttachmentDto:
    if len(data) > _MAX_ATTACHMENT_BYTES:
        raise ValidationError("Attachments must be under 5 MB")
    doc = await note_attachment_repository.create(note_id, user_id, filename, content_type, data)
    return _to_dto(doc)


async def get_file(attachment_id: ObjectId, user_id: ObjectId) -> NoteAttachment:
    doc = await note_attachment_repository.find_by_id(attachment_id, user_id)
    if not doc:
        raise NotFoundError("Attachment not found")
    return doc
