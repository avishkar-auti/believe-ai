from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from models.note_flashcard import NoteFlashcard


async def replace_for_note(user_id: ObjectId, note_id: ObjectId, cards: list[tuple[str, str]]) -> list[NoteFlashcard]:
    """Saving a fresh set for a note replaces whatever was saved before —
    review progress on the old set doesn't carry over to regenerated cards
    since their content (and therefore what's actually being learned) has changed."""
    await NoteFlashcard.find(NoteFlashcard.userId == user_id, NoteFlashcard.noteId == note_id).delete()
    docs = [NoteFlashcard(userId=user_id, noteId=note_id, front=front, back=back) for front, back in cards]
    if docs:
        # insert_many doesn't write generated _ids back onto the original objects (a known
        # Beanie quirk) — zip them back on so callers can build DTOs with real ids.
        result = await NoteFlashcard.insert_many(docs)
        for doc, inserted_id in zip(docs, result.inserted_ids, strict=True):
            doc.id = inserted_id
    return docs


async def find_by_id(card_id: ObjectId, user_id: ObjectId) -> NoteFlashcard | None:
    return await NoteFlashcard.find_one(NoteFlashcard.id == card_id, NoteFlashcard.userId == user_id)


async def list_due(user_id: ObjectId, limit: int) -> list[NoteFlashcard]:
    now = datetime.now(UTC)
    return await NoteFlashcard.find(NoteFlashcard.userId == user_id, NoteFlashcard.dueAt <= now).sort("dueAt").limit(limit).to_list()


async def count_due(user_id: ObjectId) -> int:
    now = datetime.now(UTC)
    return await NoteFlashcard.find(NoteFlashcard.userId == user_id, NoteFlashcard.dueAt <= now).count()


async def save(doc: NoteFlashcard) -> NoteFlashcard:
    await doc.save()
    return doc
