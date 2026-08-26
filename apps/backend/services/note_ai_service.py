"""Believe Notes AI Copilot + tutor — retrieval and business logic live here;
agents/note_ai_agent.py stays a thin with_fallback wrapper. Mirrors
resume_chat_service.py's shape for the tutor (retrieve top-K chunks across
the student's own notes, answer grounded only in those excerpts, log a
groundedness warning rather than blocking)."""

from __future__ import annotations

from bson import ObjectId

from agents.note_ai_agent import (
    chat_with_notes,
    cleanup_note_transcript,
    generate_note_flashcards,
    generate_note_quiz,
    parse_voice_command,
    transform_note_text,
)
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from rag.grounding import grounding_overlap, is_grounded
from rag.query_analysis import plan_from_query
from rag.retriever import embed_query_and_score, top_k
from repositories import note_repository
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
from schemas.note import NoteSearchResultDto, RelatedNoteDto
from services.note_service import extract_plain_text, get_plain_text

logger = get_logger(__name__)

TOP_K_CHUNKS = 5
TOP_K_RELATED_NOTES = 5
TOP_K_SEARCH_RESULTS = 8
_SNIPPET_MAX_CHARS = 180


async def transform_selection(settings: Settings, req: NoteTextTransformRequest) -> NoteTextTransformResult:
    return await transform_note_text(settings, req)


async def cleanup_transcript(settings: Settings, req: NoteTranscriptCleanupRequest) -> NoteTranscriptCleanupResult:
    return await cleanup_note_transcript(settings, req)


async def quiz_for_note(settings: Settings, user_id: ObjectId, note_id: ObjectId, question_count: int) -> NoteQuizResult:
    title, plain_text = await get_plain_text(note_id, user_id)
    if not plain_text.strip():
        raise NotFoundError("This note has no content to quiz yet")
    return await generate_note_quiz(settings, NoteQuizRequest(noteTitle=title, noteText=plain_text, questionCount=question_count))


async def flashcards_for_note(settings: Settings, user_id: ObjectId, note_id: ObjectId, card_count: int) -> NoteFlashcardsResult:
    title, plain_text = await get_plain_text(note_id, user_id)
    if not plain_text.strip():
        raise NotFoundError("This note has no content to make flashcards from yet")
    return await generate_note_flashcards(settings, NoteFlashcardsRequest(noteTitle=title, noteText=plain_text, cardCount=card_count))


async def summarize_note(settings: Settings, user_id: ObjectId, note_id: ObjectId) -> NoteTextTransformResult:
    """Powers both the "summarize" voice command and any future explicit
    "summarize this note" button — the whole note's text, not just a selection."""
    _title, plain_text = await get_plain_text(note_id, user_id)
    if not plain_text.strip():
        raise NotFoundError("This note has no content to summarize yet")
    return await transform_note_text(settings, NoteTextTransformRequest(text=plain_text, action="summarize"))


async def interpret_voice_command(settings: Settings, has_active_note: bool, transcript: str) -> VoiceCommandResult:
    return await parse_voice_command(settings, VoiceCommandRequest(transcript=transcript, hasActiveNote=has_active_note))


async def ask_tutor(settings: Settings, user_id: ObjectId, req: NoteTutorRequest) -> NoteTutorResult:
    notes = await note_repository.list_by_user(user_id, None, None)
    embedded_chunks = [(n.title, c.text, c.vector) for n in notes for c in n.chunks if c.vector]
    if not embedded_chunks:
        raise NotFoundError("No notes are ready to search yet — write a note first")

    plan = plan_from_query(req.question)
    scored = await embed_query_and_score(settings, plan.query_text, [v for _, _, v in embedded_chunks])
    top = top_k(scored, TOP_K_CHUNKS)
    excerpts = [embedded_chunks[c.index][1] for c in top]

    result = await chat_with_notes(settings, req, excerpts)

    source_text = "\n".join(excerpts)
    if not is_grounded(result.answer, source_text):
        logger.warning(
            "Note tutor answer for user %s scored low on the grounding check (overlap=%.2f) — may have drifted",
            user_id,
            grounding_overlap(result.answer, source_text),
        )
    return result


async def find_related(settings: Settings, user_id: ObjectId, note_id: ObjectId) -> list[RelatedNoteDto]:
    source = await note_repository.find_by_id(note_id, user_id)
    if not source:
        raise NotFoundError("Note not found")
    source_text = extract_plain_text(source.content)
    if not source_text.strip():
        return []

    others = await note_repository.find_other_embedded_chunks(user_id, note_id)
    if not others:
        return []
    owners = [(other_id, other_title) for other_id, other_title, _vector in others]
    all_vectors: list[list[float] | None] = [vector for _id, _title, vector in others]

    plan = plan_from_query(source_text[:1500])
    scored_chunks = await embed_query_and_score(settings, plan.query_text, all_vectors)

    best_by_note: dict[ObjectId, tuple[str, float | None]] = {}
    for candidate in scored_chunks:
        owner_id, owner_title = owners[candidate.index]
        current = best_by_note.get(owner_id)
        if current is None or (candidate.score or -1) > (current[1] or -1):
            best_by_note[owner_id] = (owner_title, candidate.score)

    ranked = sorted(best_by_note.items(), key=lambda item: item[1][1] if item[1][1] is not None else -1, reverse=True)
    return [RelatedNoteDto(id=str(other_id), title=title, score=score) for other_id, (title, score) in ranked[:TOP_K_RELATED_NOTES]]


def _snippet(text: str) -> str:
    trimmed = text.strip()
    return trimmed if len(trimmed) <= _SNIPPET_MAX_CHARS else trimmed[:_SNIPPET_MAX_CHARS].rsplit(" ", 1)[0] + "…"


async def search_notes(settings: Settings, user_id: ObjectId, query: str) -> list[NoteSearchResultDto]:
    """Semantic search across every one of the caller's own notes — same
    embed-query-and-score-against-stored-vectors shape as the tutor and "find
    related", just rolled up per note with the best-matching chunk kept as a
    snippet instead of feeding an LLM answer."""
    chunks = await note_repository.find_all_embedded_chunks(user_id)
    if not chunks:
        return []

    plan = plan_from_query(query)
    scored = await embed_query_and_score(settings, plan.query_text, [vector for _id, _title, _text, vector in chunks])

    best_by_note: dict[ObjectId, tuple[str, str, float | None]] = {}
    for candidate in scored:
        note_id, title, text, _vector = chunks[candidate.index]
        current = best_by_note.get(note_id)
        if current is None or (candidate.score or -1) > (current[2] or -1):
            best_by_note[note_id] = (title, text, candidate.score)

    ranked = sorted(best_by_note.items(), key=lambda item: item[1][2] if item[1][2] is not None else -1, reverse=True)
    return [
        NoteSearchResultDto(id=str(note_id), title=title, snippet=_snippet(text), score=score)
        for note_id, (title, text, score) in ranked[:TOP_K_SEARCH_RESULTS]
    ]
