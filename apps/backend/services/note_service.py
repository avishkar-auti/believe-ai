"""Believe Notes CRUD + the embedding pipeline that keeps each note
retrievable for AI Copilot's "find related" and the tutor's grounded Q&A.
Mirrors resume_service.py's shape: parsing/chunking happen inline (so a note
is always readable even if every AI provider is down), and a failed embed
degrades the note to un-retrievable rather than failing the save.
"""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from agents.embedding_agent import embed_texts
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from core.logging import get_logger
from models.note import Note, NoteChunk
from repositories import note_repository
from schemas.ai import EmbedTextsRequest
from schemas.note import CreateNoteInput, NoteDto, NoteSummaryDto, NoteView, UpdateNoteInput
from utils.chunk_text import chunk_text

logger = get_logger(__name__)


def extract_plain_text(node: dict[str, Any] | None) -> str:
    """Walks a TipTap/ProseMirror JSON document, concatenating every text
    node — the only representation an LLM prompt or embedding call can use;
    the document JSON itself is editor-internal structure, not prose."""
    if not node:
        return ""
    parts: list[str] = []
    if isinstance(node.get("text"), str):
        parts.append(node["text"])
    for child in node.get("content") or []:
        parts.append(extract_plain_text(child))
    joiner = "\n" if node.get("type") in {"paragraph", "heading", "listItem", "tableRow", "codeBlock"} else " "
    return joiner.join(p for p in parts if p)


def _to_dto(doc: Note) -> NoteDto:
    assert doc.id is not None
    return NoteDto(
        id=str(doc.id),
        title=doc.title,
        content=doc.content,
        folderId=str(doc.folderId) if doc.folderId else None,
        tags=doc.tags,
        pinned=doc.pinned,
        archived=doc.archived,
        linkedEntityType=doc.linkedEntityType,
        linkedEntityId=doc.linkedEntityId,
        linkedEntityLabel=doc.linkedEntityLabel,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


_PREVIEW_LENGTH = 140


def _preview(plain_text: str) -> str:
    """Word-boundary-trimmed snippet for the notes list — same shape as the
    search endpoint's own snippet, just a shorter cap for a list row."""
    text = " ".join(plain_text.split())
    if len(text) <= _PREVIEW_LENGTH:
        return text
    trimmed = text[:_PREVIEW_LENGTH].rsplit(" ", 1)[0]
    return f"{trimmed}…"


def _to_summary_dto(doc: Note) -> NoteSummaryDto:
    assert doc.id is not None
    return NoteSummaryDto(
        id=str(doc.id),
        title=doc.title,
        preview=_preview(doc.plainText),
        folderId=str(doc.folderId) if doc.folderId else None,
        tags=doc.tags,
        pinned=doc.pinned,
        archived=doc.archived,
        linkedEntityType=doc.linkedEntityType,
        linkedEntityId=doc.linkedEntityId,
        linkedEntityLabel=doc.linkedEntityLabel,
        updatedAt=doc.updatedAt.isoformat(),
    )


async def _embed_chunks(settings: Settings, plain_text: str, user_id: ObjectId, note_id: str | None) -> list[NoteChunk]:
    texts = chunk_text(plain_text)
    if not texts:
        return []
    try:
        result = await embed_texts(settings, EmbedTextsRequest(texts=texts))
        return [NoteChunk(text=t, vector=v) for t, v in zip(texts, result.vectors, strict=True)]
    except Exception as err:  # noqa: BLE001 — a failed embed must never fail the note save
        logger.warning("Note embedding failed for user %s note %s: %s", user_id, note_id or "new", err)
        return [NoteChunk(text=t, vector=None) for t in texts]


async def create(settings: Settings, user_id: ObjectId, input_: CreateNoteInput) -> NoteDto:
    folder_id = ObjectId(input_.folderId) if input_.folderId else None
    doc = await note_repository.create(
        user_id,
        input_.title,
        input_.content,
        folder_id,
        input_.tags,
        linked_entity_type=input_.linkedEntityType,
        linked_entity_id=input_.linkedEntityId,
        linked_entity_label=input_.linkedEntityLabel,
    )
    plain_text = extract_plain_text(input_.content)
    chunks = await _embed_chunks(settings, plain_text, user_id, None)
    assert doc.id is not None
    updated = await note_repository.update(doc.id, user_id, title=None, content=None, plain_text=plain_text, chunks=chunks)
    return _to_dto(updated or doc)


async def list_for_user(user_id: ObjectId, folder_id: str | None, tag: str | None, view: NoteView = "active") -> list[NoteSummaryDto]:
    fid = ObjectId(folder_id) if folder_id else None
    docs = await note_repository.list_by_user(user_id, fid, tag, view)
    return [_to_summary_dto(d) for d in docs]


async def list_tags(user_id: ObjectId) -> list[str]:
    return await note_repository.distinct_tags(user_id)


async def get(note_id: ObjectId, user_id: ObjectId) -> NoteDto:
    doc = await note_repository.find_by_id(note_id, user_id)
    if not doc:
        raise NotFoundError("Note not found")
    return _to_dto(doc)


async def get_plain_text(note_id: ObjectId, user_id: ObjectId) -> tuple[str, str]:
    """Returns (title, plainText) — used by the AI Copilot quiz/flashcard endpoints."""
    doc = await note_repository.find_by_id(note_id, user_id)
    if not doc:
        raise NotFoundError("Note not found")
    return doc.title, extract_plain_text(doc.content)


async def update(settings: Settings, note_id: ObjectId, user_id: ObjectId, input_: UpdateNoteInput) -> NoteDto:
    existing = await note_repository.find_by_id(note_id, user_id)
    if not existing:
        raise NotFoundError("Note not found")

    # exclude_unset distinguishes "field not sent" from "field sent as null" — the only way
    # to support folderId's three real states (leave as-is / clear to unfiled / set to X).
    provided = input_.model_dump(exclude_unset=True)

    plain_text = None
    chunks = None
    if "content" in provided:
        plain_text = extract_plain_text(input_.content)
        chunks = await _embed_chunks(settings, plain_text, user_id, str(note_id))

    folder_id: ObjectId | None
    if "folderId" not in provided:
        folder_id = ...  # type: ignore[assignment]  # not supplied — leave folderId as-is
    else:
        folder_id = ObjectId(input_.folderId) if input_.folderId else None

    # linkedEntityType/Id/Label are always set together, so gate them as one
    # unit off whichever field is present — leaving all three untouched, or
    # replacing all three (a client sending one of the trio should send the
    # others too; this mirrors folderId's own leave/clear/set pattern).
    linked_fields_provided = provided.keys() & {"linkedEntityType", "linkedEntityId", "linkedEntityLabel"}
    linked_entity_type = input_.linkedEntityType if linked_fields_provided else ...
    linked_entity_id = input_.linkedEntityId if linked_fields_provided else ...
    linked_entity_label = input_.linkedEntityLabel if linked_fields_provided else ...

    updated = await note_repository.update(
        note_id,
        user_id,
        title=input_.title,
        content=input_.content,
        plain_text=plain_text,
        chunks=chunks,
        folder_id=folder_id,
        tags=input_.tags,
        pinned=input_.pinned,
        archived=input_.archived,
        linked_entity_type=linked_entity_type,  # type: ignore[arg-type]
        linked_entity_id=linked_entity_id,  # type: ignore[arg-type]
        linked_entity_label=linked_entity_label,  # type: ignore[arg-type]
    )
    if not updated:
        raise NotFoundError("Note not found")
    return _to_dto(updated)


async def delete(note_id: ObjectId, user_id: ObjectId) -> None:
    """Soft delete — moves the note to trash. See `permanent_delete` to
    actually remove it."""
    deleted = await note_repository.delete(note_id, user_id)
    if not deleted:
        raise NotFoundError("Note not found")


async def restore(note_id: ObjectId, user_id: ObjectId) -> NoteDto:
    doc = await note_repository.restore(note_id, user_id)
    if not doc:
        raise NotFoundError("Note not found")
    return _to_dto(doc)


async def permanent_delete(note_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await note_repository.permanent_delete(note_id, user_id)
    if not deleted:
        raise NotFoundError("Note not found")


def validate_note_owner(note_id: str) -> ObjectId:
    try:
        return ObjectId(note_id)
    except Exception as err:  # noqa: BLE001 — malformed id is a client error, not a server fault
        raise ValidationError("Invalid note id") from err
