from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from models.note_folder import NoteFolder
from repositories import note_folder_repository
from schemas.note import CreateNoteFolderInput, NoteFolderDto


def _to_dto(doc: NoteFolder) -> NoteFolderDto:
    assert doc.id is not None
    return NoteFolderDto(id=str(doc.id), name=doc.name, createdAt=doc.createdAt.isoformat())


async def create(user_id: ObjectId, input_: CreateNoteFolderInput) -> NoteFolderDto:
    doc = await note_folder_repository.create(user_id, input_.name)
    return _to_dto(doc)


async def list_for_user(user_id: ObjectId) -> list[NoteFolderDto]:
    docs = await note_folder_repository.list_by_user(user_id)
    return [_to_dto(d) for d in docs]


async def delete(folder_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await note_folder_repository.delete(folder_id, user_id)
    if not deleted:
        raise NotFoundError("Folder not found")
