"""Matching vocabulary for services/job_parsing.py — not per-run data, this
doesn't vary between jobs, it's what the parser scans real posting text
against. Mirrors apps/api's config/jobParsingVocab.ts exactly."""

from __future__ import annotations

import re

DEFAULT_EXPERIENCE_LEVEL = "Not specified"
DEFAULT_LOCATION = "Not specified"

# Ordered — first matching pattern wins (most specific seniority signals first).
EXPERIENCE_LEVEL_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bprincipal\b", re.IGNORECASE), "Principal"),
    (re.compile(r"\bstaff\b", re.IGNORECASE), "Staff"),
    (re.compile(r"\b(senior|sr\.?)\b", re.IGNORECASE), "Senior"),
    (re.compile(r"\blead\b", re.IGNORECASE), "Lead"),
    (re.compile(r"\b(junior|jr\.?)\b", re.IGNORECASE), "Junior"),
    (re.compile(r"\b(entry[\s-]?level|new grad(uate)?)\b", re.IGNORECASE), "Entry-level"),
    (re.compile(r"\b(mid[\s-]?level|intermediate)\b", re.IGNORECASE), "Mid"),
]

LOCATION_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bremote\b", re.IGNORECASE), "Remote"),
    (re.compile(r"\bhybrid\b", re.IGNORECASE), "Hybrid"),
    (re.compile(r"\bon[\s-]?site\b", re.IGNORECASE), "Onsite"),
]

KNOWN_SKILL_KEYWORDS = [
    "Python", "FastAPI", "Django", "Flask", "JavaScript", "TypeScript",
    "React", "Vue", "Angular", "Node.js", "Java", "Spring", "Go", "Rust",
    "C++", "C#", "Ruby", "Rails", "PHP", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Terraform",
    "Jenkins", "CI/CD", "GraphQL", "REST APIs", "gRPC", "Kafka",
    "RabbitMQ", "Elasticsearch", "Microservices", "TDD", "Agile", "Scrum",
    "Machine Learning", "TensorFlow", "PyTorch", "SQL", "NoSQL", "Linux",
    "Git", "HTML", "CSS", "Tailwind", "Next.js", "Swift", "Kotlin",
    "Android", "iOS",
]  # fmt: skip

# ATS systems typically scan for both hard skills and common process/soft-skill phrasing.
ATS_KEYWORD_VOCAB = [
    *KNOWN_SKILL_KEYWORDS,
    "cross-functional",
    "stakeholder management",
    "CI/CD pipeline",
    "code review",
    "on-call",
]

# Only fires if the posting explicitly names a team — never fabricated when absent.
HIRING_TEAM_NAME_PATTERNS = [
    re.compile(r"join(?:ing)? the ([A-Z][\w& ]{2,40}) team"),
    re.compile(r"report(?:s|ing)? to (?:the )?([A-Z][\w& ]{2,40}) team"),
    re.compile(r"(?:on|within) the ([A-Z][\w& ]{2,40}) team"),
]
