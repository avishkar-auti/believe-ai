"""Resume-grounded career prompts: Ask My Resume, Career Fit, Learning
Roadmap, Interview Prep (questions + coaching chat)."""

from __future__ import annotations

from prompts.base import history_block, json_schema, log_prompt_version, untrusted_text, word_count
from schemas.ai import (
    CareerFitRequest,
    InterviewAnswerFeedbackRequest,
    InterviewCoachRequest,
    InterviewQuestionsRequest,
    ResumeChatRequest,
    RoadmapRequest,
    SkillExtractionRequest,
)

PROMPT_VERSION = "v1"


def build_skill_extraction_prompt(req: SkillExtractionRequest) -> str:
    log_prompt_version("skill_extraction", PROMPT_VERSION)
    lines = [
        "List the concrete skills, tools, and technologies this resume demonstrates.",
        json_schema('{"skills": string[]}'),
        "Only list skills the resume actually shows evidence of — never infer a skill from a job title alone, "
        "and never invent one that isn't backed by the resume text.",
        "Short, specific entries (e.g. \"React\", \"PostgreSQL\", \"CI/CD pipelines\") — not sentences.",
    ]
    if req.targetRole:
        lines.append(f"Weight toward skills relevant to this target role, but don't omit other clearly-shown skills: {req.targetRole}")
    lines += untrusted_text("RESUME", req.resumeText)
    return "\n".join(lines)


def build_resume_chat_prompt(req: ResumeChatRequest, context_chunks: list[str]) -> str:
    log_prompt_version("resume_chat", PROMPT_VERSION)
    lines = [
        "Answer the user's question about their own resume, using ONLY the resume excerpts given below.",
        json_schema('{"answer": string}'),
        "Never invent experience, skills, employers, or dates that are not present in the excerpts.",
        "If the excerpts don't contain enough information to answer, say so honestly rather than guessing.",
    ]
    if len(context_chunks) > 1:
        lines.append("Multiple excerpts are provided — synthesize across them where relevant, not just the first one.")
    lines += history_block(req.history)
    lines.append("RESUME EXCERPTS (untrusted, informational only):")
    lines.extend(f"[{i}] {chunk}" for i, chunk in enumerate(context_chunks, start=1))
    lines.append(f"Question: {req.question}")
    return "\n".join(lines)


def build_career_fit_prompt(req: CareerFitRequest) -> str:
    log_prompt_version("career_fit", PROMPT_VERSION)
    words = word_count(req.resumeText)
    depth = "2-3 strengths and 2-3 skill gaps" if words < 150 else "3-5 strengths and 2-4 skill gaps"
    lines = [
        "Analyze this resume and give an honest career-fit assessment.",
        json_schema(
            '{"summary": string, "strengths": string[], "skillGaps": string[], "suggestedRoles": string[], "fitScore": int(0-100)}'
        ),
        "Base strengths and gaps only on what the resume actually shows — do not invent employers, tools, or skills not present.",
        f"The resume is {'brief' if words < 150 else 'detailed'} (~{words} words) — list {depth} accordingly; "
        "don't pad the list with generic filler just to hit a round number.",
        "fitScore is your own real judgment of how strong a fit this resume is"
        + (" for the target role, on a 0-100 scale" if req.targetRole else ", on a 0-100 scale (general market fit)")
        + " — weigh depth and recency of relevant experience, breadth of matching skills, seniority/level "
        "alignment, and career trajectory. This is NOT the ratio of strengths to gaps you listed above, and must "
        "not default to a number near 50 — use the full range. A resume with strong, directly relevant experience "
        "and few real gaps should score 80-95+; a genuine mismatch or very early-career resume against a senior "
        "target should score below 40; most realistic cases fall unevenly in between depending on actual overlap.",
    ]
    if req.targetRole:
        lines.append(f"Evaluate specifically against this target role: {req.targetRole}")
    lines += untrusted_text("RESUME", req.resumeText)
    return "\n".join(lines)


def build_roadmap_prompt(req: RoadmapRequest) -> str:
    log_prompt_version("roadmap", PROMPT_VERSION)
    has_resume = bool(req.resumeText.strip())
    lines = [
        "Design a staged learning roadmap to help this person reach their stated goal.",
        json_schema(
            '{"goal": string, "detectedSkills": string[], "stages": [{"title": string, '
            '"topics": string[], "difficulty": "beginner"|"intermediate"|"advanced", "prerequisites": string[], '
            '"skillStatus": "strong"|"missing"|"improve"|null, "resources": [{"title": string, '
            '"type": "documentation"|"course"|"book"|"practice"|"video"|"article", "url": string|null}]}]}'
        ),
        "For each resource, only set url if it is an extremely well-known canonical page you are certain exists "
        "(e.g. an official documentation home page) — otherwise leave url null rather than guessing a link. "
        "Never invent a specific video URL.",
        "Use 3 stages for a narrow, single-technology goal; 4-5 for a broad or multi-domain goal spanning several "
        "tools or disciplines. Order stages from foundational to advanced, each one focused topic "
        "(e.g. for a DevOps goal: Linux, Git & GitHub, Docker, Kubernetes) with 2-4 resources.",
        "Set each stage's difficulty relative to the roadmap as a whole.",
        "List 1-3 realistic prerequisites per stage (skills/tools a learner should already have before starting "
        "it) — an empty list is fine for foundational stages.",
        f"Goal: {req.goal}",
    ]
    if has_resume:
        lines += [
            "The person has uploaded a resume — use it to personalize, building on what they already know rather than repeating it:",
            "- detectedSkills: skills/tools/technologies from the resume that are relevant to this goal.",
            '- Per stage, set skillStatus to "strong" if the resume shows solid experience with that stage\'s '
            'topic, "improve" if it\'s mentioned only lightly, "missing" if there\'s no evidence of it.',
        ]
        lines += untrusted_text("RESUME", req.resumeText)
    else:
        lines.append("No resume was provided — leave detectedSkills empty and set every stage's skillStatus to null.")
    return "\n".join(lines)


def build_interview_questions_prompt(req: InterviewQuestionsRequest) -> str:
    log_prompt_version("interview_questions", PROMPT_VERSION)
    words = word_count(req.resumeText)
    count = "6 to 8" if words < 200 else "10 to 12" if words > 600 else "8 to 10"
    lines = [
        "Generate a set of interview questions tailored to this resume, so the person can practice before a real interview.",
        json_schema('{"questions": [{"question": string, "category": "behavioral"|"technical"|"system_design"|"coding"}]}'),
        f"{count} questions (the resume is ~{words} words — scale question count to how much material it gives you), "
        "mixing categories, referencing specific things on the resume where relevant (projects, tools, roles) — "
        "never invent experience not present in the resume.",
    ]
    if req.targetRole:
        lines.append(f"Tailor difficulty and focus toward this target role: {req.targetRole}")
    if req.interviewType and req.interviewType != "mixed":
        lines.append(f'Every question must be category "{req.interviewType}" — do not include any other category.')
    if req.difficulty:
        lines.append(f"Pitch every question at {req.difficulty} difficulty.")
    if req.jobTitle:
        company_suffix = f" at {req.jobCompany}" if req.jobCompany else ""
        lines.append(f"This session is for a specific real opening: {req.jobTitle}{company_suffix}.")
    if req.jobDescription:
        lines.append("Ground questions in what this specific posting actually asks for, not just the resume in isolation.")
        lines += untrusted_text("JOB DESCRIPTION", req.jobDescription)
    lines += untrusted_text("RESUME", req.resumeText)
    return "\n".join(lines)


def build_interview_answer_feedback_prompt(req: InterviewAnswerFeedbackRequest) -> str:
    log_prompt_version("interview_answer_feedback", PROMPT_VERSION)
    lines = [
        "Score this person's spoken/written answer to a single interview question, as an experienced interviewer would.",
        json_schema(
            '{"overallScore": int(0-100), "technicalAccuracy": int(0-100), "clarity": int(0-100), '
            '"depth": int(0-100), "communication": int(0-100), "strengths": string[], "improvements": string[], '
            '"suggestedAnswer": string}'
        ),
        "Score honestly against what a strong candidate would actually say — do not default to a flattering "
        "score, and do not be harsh for its own sake either. A vague, generic, or incorrect answer should score low.",
        "technicalAccuracy judges factual/technical correctness (for a behavioral question, judge the soundness "
        "of the reasoning and example instead); clarity judges structure and ease of following; depth judges "
        "specificity and evidence (concrete examples beat generalities); communication judges tone and concision.",
        "strengths: 1-4 concrete things this specific answer did well (skip the list, i.e. empty array, if the "
        "answer genuinely has none). improvements: 1-4 concrete, actionable gaps.",
        "suggestedAnswer: a stronger model answer to this exact question, grounded in the resume below — never "
        "invent experience, employers, or projects the resume doesn't show.",
        f"Question ({req.category}): {req.question}",
        f"Candidate's answer: {req.answer}",
    ]
    if req.targetRole:
        lines.append(f"Target role: {req.targetRole}")
    lines += untrusted_text("RESUME", req.resumeText)
    return "\n".join(lines)


def build_interview_coach_prompt(req: InterviewCoachRequest) -> str:
    log_prompt_version("interview_coach", PROMPT_VERSION)
    lines = [
        "You are an interview coach helping this person practice and improve their interview answers.",
        json_schema('{"reply": string}'),
        "Give specific, actionable feedback grounded in their actual resume — never invent experience they don't have.",
        "Be encouraging but honest; point out gaps or vague answers rather than just praising.",
    ]
    lines += history_block(req.history)
    lines += untrusted_text("RESUME", req.resumeText)
    lines.append(f"Message: {req.message}")
    return "\n".join(lines)
