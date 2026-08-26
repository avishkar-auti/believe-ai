"""Believe Notes — every note's content is fully user-authored, so the
untrusted_text() wrapping used throughout this module isn't optional: a note
is exactly the kind of place a prompt-injection attempt would be planted."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_text
from schemas.ai import (
    NoteFlashcardsRequest,
    NoteQuizRequest,
    NoteTextTransformRequest,
    NoteTranscriptCleanupRequest,
    NoteTutorRequest,
    VoiceCommandRequest,
)

PROMPT_VERSION = "1.0.0"

_ACTION_INSTRUCTIONS = {
    "explain": "Explain the following note text more clearly, in plain language, without changing its meaning.",
    "simplify": "Rewrite the following note text more simply, for someone new to the topic.",
    "summarize": "Summarize the following note text in a few concise sentences.",
    "fix_grammar": "Fix the grammar and spelling of the following note text without changing its meaning or content.",
    "generate_example": "Give one concrete, worked example that illustrates the following note text.",
}


def build_note_transform_prompt(req: NoteTextTransformRequest) -> str:
    log_prompt_version("note_transform", PROMPT_VERSION)
    lines = [
        _ACTION_INSTRUCTIONS[req.action],
        "Ground your response only in the text given below — never invent facts, examples, or claims not implied by it.",
        *untrusted_text("Note text", req.text),
        json_schema("{result: string}"),
    ]
    return "\n".join(lines)


def build_note_quiz_prompt(req: NoteQuizRequest) -> str:
    log_prompt_version("note_quiz", PROMPT_VERSION)
    lines = [
        f"Write {req.questionCount} multiple-choice quiz questions that test understanding of the note below.",
        "Every question, option, and explanation must be answerable strictly from the note's own content — never invent facts.",
        "Each question has exactly 4 options and one correct answer (by index, 0-based).",
        f"Note title (untrusted): {req.noteTitle}",
        *untrusted_text("Note text", req.noteText),
        json_schema(
            "{questions: [{question: string, options: string[4], correctIndex: number, explanation: string|null}]}"
        ),
    ]
    return "\n".join(lines)


def build_note_flashcards_prompt(req: NoteFlashcardsRequest) -> str:
    log_prompt_version("note_flashcards", PROMPT_VERSION)
    lines = [
        f"Write {req.cardCount} flashcards (front=question/term, back=answer/definition) from the note below.",
        "Every card must be grounded strictly in the note's own content — never invent facts not present in it.",
        f"Note title (untrusted): {req.noteTitle}",
        *untrusted_text("Note text", req.noteText),
        json_schema("{cards: [{front: string, back: string}]}"),
    ]
    return "\n".join(lines)


def build_note_tutor_prompt(req: NoteTutorRequest, context_chunks: list[str]) -> str:
    log_prompt_version("note_tutor", PROMPT_VERSION)
    lines = [
        "You are tutoring a student using only excerpts retrieved from their own notes below.",
        "Answer the student's question grounded strictly in these excerpts. If the excerpts don't contain",
        "enough information to answer, say so plainly rather than filling the gap with outside knowledge.",
        *untrusted_text("Retrieved note excerpts", "\n---\n".join(context_chunks) if context_chunks else "(none found)"),
        f"Student's question (untrusted): {req.question}",
        json_schema("{answer: string}"),
    ]
    return "\n".join(lines)


def build_note_transcript_cleanup_prompt(req: NoteTranscriptCleanupRequest) -> str:
    log_prompt_version("note_transcript_cleanup", PROMPT_VERSION)
    lines = [
        "The text below is a raw speech-to-text transcript of a student thinking out loud while studying.",
        "Turn it into a well-organized study note in Markdown: a short title, then headed sections",
        "(e.g. Concept, Key points, Complexity, Examples, My understanding — use whichever genuinely fit",
        "the content, skip ones that don't apply). Clean up filler words and false starts, but do not add",
        "any fact, number, or claim that isn't actually present in the transcript.",
        *untrusted_text("Raw transcript", req.rawTranscript),
        json_schema("{title: string, markdown: string}"),
    ]
    return "\n".join(lines)


def build_voice_command_prompt(req: VoiceCommandRequest) -> str:
    log_prompt_version("voice_command", PROMPT_VERSION)
    active_note_note = (
        "A note is currently open, so 'add_section' and 'summarize' are valid."
        if req.hasActiveNote
        else "No note is currently open, so 'add_section' and 'summarize' are NOT valid right now "
        "— use 'none' instead if the transcript asks for one of those."
    )
    lines = [
        "The text below is a spoken transcript from a student using a note-taking app. Decide whether it is an",
        "instruction to the app (a command) or just note content the student is dictating to write down.",
        "Recognized commands, matched by their clear intent, not exact wording:",
        "- create_note: student asks to create/start a new note with a given title (extract noteTitle, exactly as spoken)",
        "- add_section: student asks to add a section/heading to the current note (extract sectionTitle, exactly as spoken)",
        "- summarize: student asks to summarize the current note or everything written so far",
        "- generate_questions: student asks to generate quiz/interview/practice questions from the current note",
        "  (extract questionCount if a number was spoken, e.g. 'five interview questions' -> 5; otherwise omit it)",
        "- none: anything else — this is just dictated content, not a command",
        active_note_note,
        "Only extract values that were actually spoken — never invent a title, section name, or count that wasn't said.",
        *untrusted_text("Transcript", req.transcript),
        json_schema(
            "{commandType: 'create_note'|'add_section'|'summarize'|'generate_questions'|'none', "
            "noteTitle: string|null, sectionTitle: string|null, questionCount: number|null}"
        ),
    ]
    return "\n".join(lines)
