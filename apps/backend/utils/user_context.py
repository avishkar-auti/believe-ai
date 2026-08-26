"""Flattens a stored Believe Profile document into a prompt-ready string —
mirrors packages/shared/src/types/userContext.ts's formatUserContextForPrompt
so both services describe a sender identically.
"""

from __future__ import annotations


def format_user_context_for_prompt(context: dict | None) -> str | None:
    if not context:
        return None
    candidates: list[str | None] = [
        context.get("aboutMe") and f"About the sender: {context['aboutMe']}",
        context.get("companyInfo") and f"Company: {context['companyInfo']}",
        context.get("servicesOrProducts") and f"Services/products: {context['servicesOrProducts']}",
        context.get("skillsAndExperience") and f"Skills/experience: {context['skillsAndExperience']}",
        context.get("achievements") and f"Achievements: {context['achievements']}",
        context.get("targetAudience") and f"Target audience: {context['targetAudience']}",
    ]
    parts: list[str] = [p for p in candidates if p]
    return "\n".join(parts) if parts else None
