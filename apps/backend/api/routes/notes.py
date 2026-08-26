"""Believe Notes — CRUD, folders, attachments, and the AI Copilot/tutor
endpoints. Every route is scoped to the caller's own notes via
MongoUserIdDep, same as every other authenticated resource in this API.

Route order matters: every static path (/folders, /transcript/cleanup,
/ai/transform, /ask) is declared before the dynamic /{note_id} routes, since
FastAPI/Starlette matches in registration order and "/notes/folders" would
otherwise be swallowed by "/notes/{note_id}" with note_id="folders"."""

from __future__ import annotations

from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from api.dependencies import MongoUserIdDep, SettingsDep
from schemas.ai import (
    NoteFlashcardsResult,
    NoteQuizResult,
    NoteTextTransformRequest,
    NoteTextTransformResult,
    NoteTranscriptCleanupRequest,
    NoteTranscriptCleanupResult,
    NoteTutorRequest,
    NoteTutorResult,
    VoiceCommandRequest,
    VoiceCommandResult,
)
from schemas.note import (
    CreateNoteFolderInput,
    CreateNoteInput,
    NoteAttachmentDto,
    NoteDto,
    NoteFlashcardDto,
    NoteFolderDto,
    NoteSearchResultDto,
    NoteSummaryDto,
    RelatedNoteDto,
    ReviewFlashcardInput,
    SaveFlashcardsInput,
    UpdateNoteInput,
)
from services import note_ai_service, note_attachment_service, note_flashcard_service, note_folder_service, note_service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/folders/", response_model=list[NoteFolderDto])
async def list_folders_route(mongo_user_id: MongoUserIdDep) -> list[NoteFolderDto]:
    return await note_folder_service.list_for_user(mongo_user_id)


@router.post("/folders/", response_model=NoteFolderDto, status_code=201)
async def create_folder_route(body: CreateNoteFolderInput, mongo_user_id: MongoUserIdDep) -> NoteFolderDto:
    return await note_folder_service.create(mongo_user_id, body)


@router.delete("/folders/{folder_id}")
async def delete_folder_route(folder_id: str, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await note_folder_service.delete(ObjectId(folder_id), mongo_user_id)
    return {"deleted": True}


@router.post("/transcript/cleanup", response_model=NoteTranscriptCleanupResult)
async def cleanup_transcript_route(
    body: NoteTranscriptCleanupRequest, settings: SettingsDep, _mongo_user_id: MongoUserIdDep
) -> NoteTranscriptCleanupResult:
    return await note_ai_service.cleanup_transcript(settings, body)


@router.post("/ai/transform", response_model=NoteTextTransformResult)
async def transform_text_route(
    body: NoteTextTransformRequest, settings: SettingsDep, _mongo_user_id: MongoUserIdDep
) -> NoteTextTransformResult:
    return await note_ai_service.transform_selection(settings, body)


@router.post("/ask", response_model=NoteTutorResult)
async def ask_tutor_route(body: NoteTutorRequest, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> NoteTutorResult:
    return await note_ai_service.ask_tutor(settings, mongo_user_id, body)


@router.get("/tags/", response_model=list[str])
async def list_tags_route(mongo_user_id: MongoUserIdDep) -> list[str]:
    return await note_service.list_tags(mongo_user_id)


@router.get("/search/", response_model=list[NoteSearchResultDto])
async def search_notes_route(q: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> list[NoteSearchResultDto]:
    if not q.strip():
        return []
    return await note_ai_service.search_notes(settings, mongo_user_id, q)


@router.post("/voice-command", response_model=VoiceCommandResult)
async def voice_command_route(body: VoiceCommandRequest, settings: SettingsDep, _mongo_user_id: MongoUserIdDep) -> VoiceCommandResult:
    return await note_ai_service.interpret_voice_command(settings, body.hasActiveNote, body.transcript)


@router.get("/review/due", response_model=list[NoteFlashcardDto])
async def list_due_flashcards_route(mongo_user_id: MongoUserIdDep, limit: int = 20) -> list[NoteFlashcardDto]:
    return await note_flashcard_service.list_due(mongo_user_id, limit)


@router.get("/review/due/count", response_model=int)
async def count_due_flashcards_route(mongo_user_id: MongoUserIdDep) -> int:
    return await note_flashcard_service.count_due(mongo_user_id)


@router.post("/review/{card_id}", response_model=NoteFlashcardDto)
async def review_flashcard_route(card_id: str, body: ReviewFlashcardInput, mongo_user_id: MongoUserIdDep) -> NoteFlashcardDto:
    return await note_flashcard_service.review(mongo_user_id, ObjectId(card_id), body.grade)


@router.get("/", response_model=list[NoteSummaryDto])
async def list_notes_route(
    mongo_user_id: MongoUserIdDep, folderId: str | None = None, tag: str | None = None
) -> list[NoteSummaryDto]:
    return await note_service.list_for_user(mongo_user_id, folderId, tag)


@router.post("/", response_model=NoteDto, status_code=201)
async def create_note_route(body: CreateNoteInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> NoteDto:
    return await note_service.create(settings, mongo_user_id, body)


@router.get("/{note_id}", response_model=NoteDto)
async def get_note_route(note_id: str, mongo_user_id: MongoUserIdDep) -> NoteDto:
    return await note_service.get(ObjectId(note_id), mongo_user_id)


@router.patch("/{note_id}", response_model=NoteDto)
async def update_note_route(note_id: str, body: UpdateNoteInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> NoteDto:
    return await note_service.update(settings, ObjectId(note_id), mongo_user_id, body)


@router.delete("/{note_id}")
async def delete_note_route(note_id: str, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await note_service.delete(ObjectId(note_id), mongo_user_id)
    return {"deleted": True}


@router.post("/{note_id}/attachments", response_model=NoteAttachmentDto, status_code=201)
async def upload_attachment_route(
    note_id: str, mongo_user_id: MongoUserIdDep, file: Annotated[UploadFile, File()]
) -> NoteAttachmentDto:
    data = await file.read()
    return await note_attachment_service.upload(
        ObjectId(note_id), mongo_user_id, file.filename or "attachment", file.content_type or "", data
    )


@router.get("/{note_id}/attachments/{attachment_id}")
async def get_attachment_route(note_id: str, attachment_id: str, mongo_user_id: MongoUserIdDep) -> Response:
    _ = note_id  # part of the URL for a stable, note-scoped link; ownership is checked via mongo_user_id below
    doc = await note_attachment_service.get_file(ObjectId(attachment_id), mongo_user_id)
    return Response(content=doc.data, media_type=doc.contentType or "application/octet-stream")


@router.post("/{note_id}/quiz", response_model=NoteQuizResult)
async def generate_quiz_route(note_id: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep, questionCount: int = 5) -> NoteQuizResult:
    return await note_ai_service.quiz_for_note(settings, mongo_user_id, ObjectId(note_id), questionCount)


@router.post("/{note_id}/flashcards", response_model=NoteFlashcardsResult)
async def generate_flashcards_route(
    note_id: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep, cardCount: int = 8
) -> NoteFlashcardsResult:
    return await note_ai_service.flashcards_for_note(settings, mongo_user_id, ObjectId(note_id), cardCount)


@router.post("/{note_id}/flashcards/save", response_model=list[NoteFlashcardDto])
async def save_flashcards_route(
    note_id: str, body: SaveFlashcardsInput, settings: SettingsDep, mongo_user_id: MongoUserIdDep
) -> list[NoteFlashcardDto]:
    return await note_flashcard_service.save_for_review(settings, mongo_user_id, ObjectId(note_id), body.cardCount)


@router.get("/{note_id}/related", response_model=list[RelatedNoteDto])
async def find_related_route(note_id: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> list[RelatedNoteDto]:
    return await note_ai_service.find_related(settings, mongo_user_id, ObjectId(note_id))


@router.post("/{note_id}/summarize", response_model=NoteTextTransformResult)
async def summarize_note_route(note_id: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep) -> NoteTextTransformResult:
    return await note_ai_service.summarize_note(settings, mongo_user_id, ObjectId(note_id))
