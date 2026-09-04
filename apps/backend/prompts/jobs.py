"""Job Board / Job Outreach prompts: outreach content generation, job
posting drafting, company-intel synthesis."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_text
from schemas.ai import CompanyIntelRequest, JobPostDraftRequest, OutreachDraftRequest, TeamExtractionRequest

PROMPT_VERSION = "v1"

LINKEDIN_NOTE_CHAR_LIMIT = 300

_SENIORITY_HINTS: dict[str, str] = {
    "intern": "emphasize mentorship, learning opportunities, and growth over independent ownership.",
    "junior": "emphasize mentorship, learning opportunities, and growth over independent ownership.",
    "entry": "emphasize mentorship, learning opportunities, and growth over independent ownership.",
    "mid": "balance concrete ownership of features/projects with room to grow.",
    "senior": "emphasize technical ownership, autonomy, and cross-team impact.",
    "staff": "emphasize technical ownership, autonomy, and cross-team impact.",
    "principal": "emphasize strategic scope, org-wide influence, and mentoring other engineers.",
    "lead": "emphasize strategic scope, org-wide influence, and mentoring other engineers.",
    "manager": "emphasize people leadership, team outcomes, and cross-functional coordination.",
    "director": "emphasize people leadership, team outcomes, and cross-functional coordination.",
}


def _seniority_hint(seniority: str | None) -> str | None:
    if not seniority:
        return None
    key = seniority.strip().lower()
    for needle, hint in _SENIORITY_HINTS.items():
        if needle in key:
            return hint
    return None


def build_outreach_draft_prompt(req: OutreachDraftRequest) -> str:
    log_prompt_version("outreach_draft", PROMPT_VERSION)
    skills_clause = ""
    if req.matchingSkills:
        skills_clause = f" The candidate's real, relevant experience includes: {', '.join(req.matchingSkills[:5])}."
    signature_clause = (
        f' Sign off with the candidate\'s real name: "{req.candidateName}".'
        if req.candidateName
        else " No candidate name was provided — close with a professional sign-off phrase only, no name, no placeholder."
    )
    is_referral = req.intent == "referral"

    lines = [
        "You are generating concise, professional outreach content on behalf of a real job candidate reaching "
        "out to a real person about a specific job opening.",
        "Write like a competent professional reaching out for the first time — clear, warm, specific, never "
        'salesy or generic. Never use filler like "I came across your profile."',
        "Every message must reference the exact grounded fact given below — never invent a detail, shared "
        "connection, or milestone not explicitly provided.",
        "If matching skills are given, weave in at most one or two naturally — never a bullet dump, and never "
        "claim a skill that wasn't given to you.",
        json_schema(
            '{"coldEmail": string, "linkedinNote": string, "referralRequest": string|null, "coverLetter": string|null}'
        ),
        'coldEmail: no "Subject:" line, a real greeting, under 150 words, ends with a clear low-pressure ask '
        f"(e.g. a quick chat).{signature_clause}",
        f"linkedinNote: aim for under {LINKEDIN_NOTE_CHAR_LIMIT} characters, no greeting or sign-off — get "
        "straight to the point (it will be hard-truncated afterward if you go over, so keep it tight).",
        "referralRequest: "
        + (
            "the candidate and this contact are already connected on LinkedIn. Write a short, respectful message "
            "that acknowledges the existing connection, references the grounded fact, and asks — without "
            "pressure — whether the contact would be comfortable referring the candidate for this specific role. "
            f"Offer to share more information if useful.{signature_clause}"
            if is_referral
            else "set to null — this is first-touch outreach, not a referral request."
        ),
        "coverLetter: "
        + (
            "write a concise cover letter for this role, referencing the fact naturally."
            if req.includeCoverLetter
            else "set to null — the candidate has no resume on file yet."
        ),
        f"Contact: {req.contactName} at {req.company}",
        f"Role: {req.roleTitle}",
        f'Grounded fact to reference: "{req.hook}"{skills_clause}',
    ]
    return "\n".join(lines)


def build_job_post_draft_prompt(req: JobPostDraftRequest) -> str:
    log_prompt_version("job_post_draft", PROMPT_VERSION)
    lines = [
        "Expand this recruiter's rough notes into a complete, professional job posting.",
        json_schema(
            '{"title": string, "description": string, "skills": string[], '
            '"employmentType": "full_time"|"part_time"|"contract"|"internship"}'
        ),
        "Only include requirements and responsibilities implied by the notes given — do not invent "
        "specific technologies, benefits, or requirements not mentioned or reasonably implied.",
        f"Role: {req.roleTitle}",
        f"Company: {req.company}",
    ]
    if req.seniority:
        lines.append(f"Seniority: {req.seniority}")
        hint = _seniority_hint(req.seniority)
        if hint:
            lines.append(f"Given this seniority level, {hint}")
    lines += untrusted_text("RECRUITER'S NOTES", req.briefDescription)
    return "\n".join(lines)


def build_company_intel_prompt(req: CompanyIntelRequest) -> str:
    log_prompt_version("company_intel", PROMPT_VERSION)
    snippet_count = len(req.snippets)
    snippets_block = "\n".join(f"- {s}" for s in req.snippets) if req.snippets else "(no public snippets found)"
    lines = [
        "You are a company-research analyst. You are given short public search snippets about a "
        "company and must extract ONLY facts explicitly supported by those snippets.",
        json_schema(
            '{"employeeCount": int|null, "techStack": string[], "funding": string|null, '
            '"hiringTrend": "growing"|"stable"|"contracting"|null, "confidence": {"employeeCount": '
            '"high"|"low", "techStack": "high"|"low", "funding": "high"|"low", "hiringTrend": "high"|"low"}}'
        ),
        "techStack is ALWAYS a JSON array, never null — use [] (an empty array) when the snippets don't "
        "mention any specific technology. employeeCount, funding, and hiringTrend are null (not a guess) "
        "when the snippets don't clearly support them.",
        "Whenever you set a field to null (or [] for techStack), mark that same field's confidence "
        '"low" — never invent a plausible-sounding number or trend.',
    ]
    if snippet_count < 3:
        lines.append(
            f"Only {snippet_count} snippet(s) were found — that's thin evidence. Default to null/low confidence "
            "on anything not unambiguously stated rather than stretching a weak signal into a firm answer."
        )
    lines.append(f"Company: {req.company}")
    lines += untrusted_text("PUBLIC SEARCH SNIPPETS", snippets_block)
    return "\n".join(lines)


def build_team_extraction_prompt(req: TeamExtractionRequest) -> str:
    log_prompt_version("team_extraction", PROMPT_VERSION)
    lines = [
        "You are extracting a list of real, named people from the text of a company's own public "
        "team/about/leadership web page.",
        json_schema('{"members": [{"name": string, "title": string|null}]}'),
        "Only include a person if their actual name is explicitly written in the text below AND the text "
        "identifies them as someone who currently works at, founded, or leads this company — never invent, "
        "guess, or infer a person who isn't named.",
        "Exclude historical figures, quoted customers, third parties, or anyone mentioned only in passing as "
        "inspiration or background (e.g. a founding story that name-drops famous people from history) — those "
        "are not current team members even though they're real named people in the text. Also skip generic "
        'mentions of roles with no name attached (e.g. "our engineering team") and skip company/product/'
        "customer names that aren't people. When genuinely unsure whether someone is a current team member, "
        "leave them out.",
        "title is the job title/role given for that person in the text, or null if none is stated — never guess one.",
        "If the text below contains no current team members at all (e.g. it's a product page, a pricing page, "
        'or a founding story about historical inspiration rather than a team roster), return {"members": []} — '
        "an empty list is a completely valid, expected answer, and often the correct one.",
        f"Company: {req.company}",
    ]
    lines += untrusted_text("COMPANY TEAM PAGE TEXT", req.pageText)
    return "\n".join(lines)
