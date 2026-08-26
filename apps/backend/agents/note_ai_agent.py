"""Thin with_fallback wrappers for every Notes AI capability — same shape as
resume_chat_agent.py. Retrieval (which excerpts chat_with_notes sees) lives
in services/note_ai_service.py, not here."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import (
    NoteFlashcardsRequest,
    NoteFlashcardsResult,
    NoteQuizRequest,
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


async def transform_note_text(settings: Settings, req: NoteTextTransformRequest) -> NoteTextTransformResult:
    return await with_fallback(settings, "transform_note_text", lambda p: p.transform_note_text(req))


async def generate_note_quiz(settings: Settings, req: NoteQuizRequest) -> NoteQuizResult:
    return await with_fallback(settings, "generate_note_quiz", lambda p: p.generate_note_quiz(req))


async def generate_note_flashcards(settings: Settings, req: NoteFlashcardsRequest) -> NoteFlashcardsResult:
    return await with_fallback(settings, "generate_note_flashcards", lambda p: p.generate_note_flashcards(req))


async def chat_with_notes(settings: Settings, req: NoteTutorRequest, context_chunks: list[str]) -> NoteTutorResult:
    return await with_fallback(settings, "chat_with_notes", lambda p: p.chat_with_notes(req, context_chunks))


async def cleanup_note_transcript(settings: Settings, req: NoteTranscriptCleanupRequest) -> NoteTranscriptCleanupResult:
    return await with_fallback(settings, "cleanup_note_transcript", lambda p: p.cleanup_note_transcript(req))


async def parse_voice_command(settings: Settings, req: VoiceCommandRequest) -> VoiceCommandResult:
    return await with_fallback(settings, "parse_voice_command", lambda p: p.parse_voice_command(req))
