"""Spaced-repetition review for saved flashcards — the standard SM-2
algorithm (Wozniak, public domain), the same scheduling method Anki's
original engine used. Ephemeral generation (the "Flashcards" quick-look
modal) stays in note_ai_service; this module only handles cards the student
has explicitly chosen to save for ongoing review."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from bson import ObjectId

from agents.note_ai_agent import generate_note_flashcards
from core.config import Settings
from core.errors import NotFoundError
from models.note_flashcard import NoteFlashcard
from repositories import note_flashcard_repository, note_repository
from schemas.ai import NoteFlashcardsRequest
from schemas.note import NoteFlashcardDto, ReviewGrade
from services.note_service import extract_plain_text

# Anki-style four-button grading mapped onto SM-2's 0-5 quality scale.
_GRADE_QUALITY: dict[ReviewGrade, int] = {"again": 1, "hard": 3, "good": 4, "easy": 5}
_MIN_EASE_FACTOR = 1.3


def _to_dto(doc: NoteFlashcard, note_title: str) -> NoteFlashcardDto:
    assert doc.id is not None
    return NoteFlashcardDto(
        id=str(doc.id),
        noteId=str(doc.noteId),
        noteTitle=note_title,
        front=doc.front,
        back=doc.back,
        dueAt=doc.dueAt.isoformat(),
        repetitions=doc.repetitions,
    )


async def save_for_review(settings: Settings, user_id: ObjectId, note_id: ObjectId, card_count: int) -> list[NoteFlashcardDto]:
    note = await note_repository.find_by_id(note_id, user_id)
    if not note:
        raise NotFoundError("Note not found")
    plain_text = extract_plain_text(note.content)
    if not plain_text.strip():
        raise NotFoundError("This note has no content to make flashcards from yet")

    generated = await generate_note_flashcards(
        settings, NoteFlashcardsRequest(noteTitle=note.title, noteText=plain_text, cardCount=card_count)
    )
    saved = await note_flashcard_repository.replace_for_note(user_id, note_id, [(c.front, c.back) for c in generated.cards])
    return [_to_dto(doc, note.title) for doc in saved]


async def list_due(user_id: ObjectId, limit: int = 20) -> list[NoteFlashcardDto]:
    due = await note_flashcard_repository.list_due(user_id, limit)
    if not due:
        return []
    titles = await note_repository.find_titles_by_ids(user_id, list({doc.noteId for doc in due}))
    return [_to_dto(doc, titles.get(doc.noteId, "Untitled note")) for doc in due]


async def count_due(user_id: ObjectId) -> int:
    return await note_flashcard_repository.count_due(user_id)


async def review(user_id: ObjectId, card_id: ObjectId, grade: ReviewGrade) -> NoteFlashcardDto:
    card = await note_flashcard_repository.find_by_id(card_id, user_id)
    if not card:
        raise NotFoundError("Flashcard not found")

    quality = _GRADE_QUALITY[grade]
    now = datetime.now(UTC)

    if quality < 3:
        card.repetitions = 0
        card.intervalDays = 1
    else:
        if card.repetitions == 0:
            card.intervalDays = 1
        elif card.repetitions == 1:
            card.intervalDays = 6
        else:
            card.intervalDays = round(card.intervalDays * card.easeFactor)
        card.repetitions += 1

    card.easeFactor = max(_MIN_EASE_FACTOR, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    card.lastReviewedAt = now
    card.dueAt = now + timedelta(days=card.intervalDays)

    saved = await note_flashcard_repository.save(card)
    note = await note_repository.find_by_id(saved.noteId, user_id)
    return _to_dto(saved, note.title if note else "Untitled note")
