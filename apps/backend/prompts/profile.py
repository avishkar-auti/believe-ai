"""Believe Identity / public profile prompts: the one-line AI summary
generator on Settings -> Public Profile."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_text
from schemas.ai import ProfileSummaryRequest

PROMPT_VERSION = "v1"


def build_profile_summary_prompt(req: ProfileSummaryRequest) -> str:
    log_prompt_version("profile_summary", PROMPT_VERSION)
    known: list[str] = []
    if req.headline:
        known.append(f"Headline: {req.headline}")
    if req.jobTitle:
        known.append(f"Job title: {req.jobTitle}")
    if req.company:
        known.append(f"Company: {req.company}")
    if req.bio:
        known.append(f"Current bio draft: {req.bio}")
    if req.aboutMe:
        known.append(f"About me: {req.aboutMe}")
    if req.skillsAndExperience:
        known.append(f"Skills & experience: {req.skillsAndExperience}")
    if req.achievements:
        known.append(f"Achievements: {req.achievements}")

    lines = [
        "You are writing a single-sentence professional summary for a public identity card — the kind of "
        "one-liner that appears under someone's name on a shareable profile.",
        json_schema('{"summary": string}'),
        "Ground every word in the facts given below — never invent a technology, role, achievement, or "
        "years of experience that isn't stated. If the facts are thin, write something short and honest "
        "rather than padding it out with generic claims.",
        "One sentence, under 140 characters, no emoji, no first person ('I am...') — third-person "
        'declarative, e.g. "AI engineer building intelligent systems and agentic workflows."',
        f"Name: {req.name}",
    ]
    lines += untrusted_text("WHAT THIS PERSON HAS TOLD US ABOUT THEMSELVES", "\n".join(known) or "(nothing else provided)")
    return "\n".join(lines)
