"""Conversational template-drafting prompt (TemplateChat)."""

from __future__ import annotations

from prompts.base import history_block, json_schema, log_prompt_version, untrusted_text
from schemas.ai import TemplateChatRequest

PROMPT_VERSION = "v1"


def build_template_chat_prompt(req: TemplateChatRequest) -> str:
    log_prompt_version("template_chat", PROMPT_VERSION)
    has_draft = bool((req.currentSubject or "").strip() or (req.currentBody or "").strip())
    lines = [
        "You are helping the user iteratively draft a reusable outreach email template through conversation — "
        "not a one-off email to a real recipient.",
        json_schema('{"reply": string, "subject": string, "body": string}'),
        "reply: a short, conversational response (1-3 sentences) explaining what you changed or asking a "
        "clarifying question if the request is ambiguous.",
        "subject and body: the FULL updated template after applying this turn's request — always return the "
        "complete draft, never a diff or partial snippet.",
        "Preserve placeholder tokens like {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}}, {{senderName}}, "
        "{{senderCompany}} wherever they make sense for a reusable template — use them instead of a specific "
        "name/company whenever the user hasn't given you a real one.",
    ]
    if has_draft:
        lines.append(
            "Apply the user's requested change to the CURRENT DRAFT below — keep everything else unchanged "
            "unless the request implies a broader rewrite."
        )
        lines += untrusted_text("CURRENT DRAFT SUBJECT", req.currentSubject or "(empty)")
        lines += untrusted_text("CURRENT DRAFT BODY", req.currentBody or "(empty)")
    else:
        lines.append(
            "There is no draft yet — create one from scratch based on the user's message below. If the message "
            'is too vague to draft anything (e.g. just "hi"), ask what the template is for instead of guessing, '
            "and return empty strings for subject/body."
        )
    lines += history_block(req.history)
    lines.append(f"User's message this turn: {req.message}")
    return "\n".join(lines)
