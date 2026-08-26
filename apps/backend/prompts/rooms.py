"""Group Practice Room prompts: discussion-question generation, rolling
recap, post-session summary."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_list
from schemas.ai import RoomQuestionsRequest, RoomRecapRequest, RoomSummaryRequest

PROMPT_VERSION = "v1"


def build_room_questions_prompt(req: RoomQuestionsRequest) -> str:
    log_prompt_version("room_questions", PROMPT_VERSION)
    count = max(6, min(12, req.participantCount * 2))
    lines = [
        "Generate open-ended discussion questions for a peer practice room — "
        f"a group of {req.participantCount} students taking turns answering and giving each other feedback.",
        json_schema('{"questions": [string, ...]}'),
        f"{count} questions (enough for every participant to get at least two turns without repeats), each a "
        "self-contained prompt any participant could answer without needing to know anyone else's background — "
        "no resume or personal history assumed.",
        "Mix behavioral and light technical/conceptual prompts; avoid yes/no questions.",
    ]
    if req.topic:
        lines.append(f"Focus the questions on this topic: {req.topic}")
    if req.targetRole:
        lines.append(f"Tailor questions toward this target role: {req.targetRole}")
    return "\n".join(lines)


def build_room_recap_prompt(req: RoomRecapRequest) -> str:
    log_prompt_version("room_recap", PROMPT_VERSION)
    lines = [
        "Write a short rolling recap of a group practice room's progress so far, for participants to skim mid-session.",
        json_schema('{"recap": string}'),
        "2-4 sentences, plain prose, no bullet points or headings.",
        "Reference concrete points actually raised in the notes/transcript below — never invent content or give generic encouragement.",
    ]
    if req.topic:
        lines.append(f"Session topic: {req.topic}")
    if req.currentQuestionText:
        lines.append(f"Current question: {req.currentQuestionText}")
    lines += untrusted_list("Recent shared-idea-board notes, oldest first", req.recentIdeas)
    lines += untrusted_list("Recent spoken transcript snippets, oldest first", req.recentTranscript)
    if not req.recentIdeas and not req.recentTranscript:
        lines.append("Nothing has been captured yet — just say the session is just getting started.")
    return "\n".join(lines)


def build_room_summary_prompt(req: RoomSummaryRequest) -> str:
    log_prompt_version("room_summary", PROMPT_VERSION)
    lines = [
        "Write a post-session summary for a group practice room where students took turns answering discussion "
        "questions and gave each other feedback.",
        json_schema(
            '{"groupSummary": string, "perStudent": [{"userId": string, "name": string, "strength": string, "growthArea": string}, ...]}'
        ),
        "groupSummary: 3-5 sentences covering what was discussed and how the group engaged overall.",
        "perStudent: exactly one entry per participant listed below, using their exact userId and name. Each gets a "
        "one-sentence strength and a one-sentence growth area, grounded in what they actually contributed (ideas, "
        "feedback comments, or transcript) — if there isn't enough material for someone, give balanced, honest "
        "feedback rather than inventing specifics.",
        "Participants (use these exact userId and name values):",
    ]
    lines.extend(f"- userId: {p.userId}, name: {p.name}" for p in req.participants)
    if req.topic:
        lines.append(f"Session topic: {req.topic}")
    lines += untrusted_list("Questions discussed", req.questions)
    lines += untrusted_list("Shared idea-board notes, oldest first", req.ideas)
    lines += untrusted_list("Peer feedback comments", req.feedbackComments)
    lines += untrusted_list("Spoken transcript snippets, oldest first", req.transcript)
    return "\n".join(lines)
