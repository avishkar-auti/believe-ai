"""Beanie-backed Notes access — same CRUD shape as repositories/job_repository.py."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from beanie.odm.enums import SortDirection
from beanie.operators import In
from bson import ObjectId

from models.note import Note, NoteChunk

NoteView = Literal["active", "archived", "trash"]


async def create(
    user_id: ObjectId,
    title: str,
    content: dict[str, Any],
    folder_id: ObjectId | None,
    tags: list[str],
    linked_entity_type: str | None = None,
    linked_entity_id: str | None = None,
    linked_entity_label: str | None = None,
) -> Note:
    doc = Note(
        userId=user_id,
        title=title,
        content=content,
        plainText="",
        folderId=folder_id,
        tags=tags,
        linkedEntityType=linked_entity_type,
        linkedEntityId=linked_entity_id,
        linkedEntityLabel=linked_entity_label,
    )
    await doc.insert()
    return doc


async def find_by_id(note_id: ObjectId, user_id: ObjectId) -> Note | None:
    return await Note.find_one(Note.id == note_id, Note.userId == user_id)


async def find_titles_by_ids(user_id: ObjectId, note_ids: list[ObjectId]) -> dict[ObjectId, str]:
    docs = await Note.find(Note.userId == user_id, In(Note.id, note_ids)).to_list()
    return {doc.id: doc.title for doc in docs if doc.id is not None}


async def distinct_tags(user_id: ObjectId) -> list[str]:
    collection = Note.get_pymongo_collection()
    tags = await collection.distinct("tags", {"userId": user_id})
    return sorted(tags)


async def list_by_user(user_id: ObjectId, folder_id: ObjectId | None, tag: str | None, view: NoteView = "active") -> list[Note]:
    query: dict[str, Any] = {"userId": user_id}
    if folder_id is not None:
        query["folderId"] = folder_id
    if tag:
        query["tags"] = tag
    if view == "trash":
        query["deletedAt"] = {"$ne": None}
    else:
        # Active and archived views both exclude the trash; "active" additionally
        # excludes archived notes, "archived" is *only* archived notes. Use $ne
        # rather than a strict False/True match so notes that predate the
        # `archived` field (no key stored at all) still count as active.
        query["deletedAt"] = None
        query["archived"] = True if view == "archived" else {"$ne": True}
    return await Note.find(query).sort([("pinned", SortDirection.DESCENDING), ("updatedAt", SortDirection.DESCENDING)]).to_list()


async def update(
    note_id: ObjectId,
    user_id: ObjectId,
    title: str | None,
    content: dict[str, Any] | None,
    plain_text: str | None,
    chunks: list[NoteChunk] | None,
    folder_id: ObjectId | None = ...,  # type: ignore[assignment]
    tags: list[str] | None = None,
    pinned: bool | None = None,
    archived: bool | None = None,
    linked_entity_type: str | None = ...,  # type: ignore[assignment]
    linked_entity_id: str | None = ...,  # type: ignore[assignment]
    linked_entity_label: str | None = ...,  # type: ignore[assignment]
) -> Note | None:
    doc = await find_by_id(note_id, user_id)
    if not doc:
        return None
    if title is not None:
        doc.title = title
    if content is not None:
        doc.content = content
    if plain_text is not None:
        doc.plainText = plain_text
    if chunks is not None:
        doc.chunks = chunks
    if folder_id is not ...:
        doc.folderId = folder_id  # type: ignore[assignment]
    if tags is not None:
        doc.tags = tags
    if pinned is not None:
        doc.pinned = pinned
    if archived is not None:
        doc.archived = archived
    if linked_entity_type is not ...:
        doc.linkedEntityType = linked_entity_type  # type: ignore[assignment]
    if linked_entity_id is not ...:
        doc.linkedEntityId = linked_entity_id  # type: ignore[assignment]
    if linked_entity_label is not ...:
        doc.linkedEntityLabel = linked_entity_label  # type: ignore[assignment]
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(note_id: ObjectId, user_id: ObjectId) -> bool:
    """Soft delete — moves the note to trash rather than removing it. See
    `permanent_delete` for the real, unrecoverable removal."""
    doc = await find_by_id(note_id, user_id)
    if not doc:
        return False
    doc.deletedAt = datetime.now(UTC)
    await doc.save()
    return True


async def restore(note_id: ObjectId, user_id: ObjectId) -> Note | None:
    doc = await find_by_id(note_id, user_id)
    if not doc:
        return None
    doc.deletedAt = None
    await doc.save()
    return doc


async def permanent_delete(note_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(note_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def find_all_embedded_chunks(user_id: ObjectId) -> list[tuple[ObjectId, str, str, list[float]]]:
    """Every one of the user's own notes' already-embedded chunks, flattened as
    (noteId, noteTitle, chunkText, vector) — the shared building block for both
    "find related notes" and cross-note search, so the caller can score chunks
    and roll scores up to the note level without a per-note round-trip. Chunks
    with no vector yet (still processing, or a prior embed failure) are
    skipped — there's nothing to score them against."""
    docs = await Note.find(Note.userId == user_id).to_list()
    return [(doc.id, doc.title, c.text, c.vector) for doc in docs if doc.id is not None for c in doc.chunks if c.vector]


async def find_other_embedded_chunks(user_id: ObjectId, exclude_note_id: ObjectId) -> list[tuple[ObjectId, str, list[float]]]:
    """Same as find_all_embedded_chunks but excludes one note (the source note in
    "find related notes", which shouldn't recommend itself) and drops chunk text,
    which that caller doesn't need."""
    all_chunks = await find_all_embedded_chunks(user_id)
    return [(note_id, title, vector) for note_id, title, _text, vector in all_chunks if note_id != exclude_note_id]
