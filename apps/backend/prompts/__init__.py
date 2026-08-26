"""Prompt builders, one module per domain — mirror packages/server/src/ai/common/prompts.ts
so both services produce equivalent output for the same inputs.

Every builder is dynamic, not templated boilerplate: instructions scale with
the actual shape of the input (resume length, participant count, sample
size, snippet count, ...) instead of hardcoding one fixed depth for every
request. Shared fragments (JSON-schema framing, untrusted-data blocks, the
system instruction) live in base.py so each domain module stays focused on
what makes that capability's prompt different — and each domain module
declares its own PROMPT_VERSION, logged on every call, so a prompt
regression is traceable to the exact shape that produced it.

    base.py            shared helpers + SYSTEM_INSTRUCTION
    email.py           writer / improve / personalize / campaign insights
    template_chat.py   conversational template drafting
    career.py          resume chat / career fit / roadmap / interview prep
    jobs.py            outreach drafts / job post drafting / company intel
    rooms.py           group practice room questions / recap / summary
    news.py            news feed relevance explanation
"""
