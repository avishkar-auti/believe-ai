"""Pydantic request/response models — mirror packages/shared/src/types/ai.ts
and schemas/ai.schema.ts so the two services agree on the wire format.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

AiImproveAction = Literal[
    "make_shorter",
    "make_professional",
    "make_friendly",
    "make_persuasive",
    "make_concise",
    "fix_grammar",
    "rewrite",
]


class AiEmailGenerationRequest(BaseModel):
    goal: str = Field(min_length=1)
    target: str = Field(min_length=1)
    tone: str = Field(min_length=1)
    context: str | None = None


class AiEmailGenerationResult(BaseModel):
    subject: str
    body: str
    cta: str


class AiImproveRequest(BaseModel):
    subject: str
    body: str
    action: AiImproveAction


class ImproveResult(BaseModel):
    subject: str
    body: str


class ContactPersonalizationInput(BaseModel):
    firstName: str
    lastName: str
    company: str | None = None
    jobTitle: str | None = None


class AiPersonalizeRequest(BaseModel):
    templateSubject: str = Field(min_length=1)
    templateBody: str = Field(min_length=1)
    contact: ContactPersonalizationInput
    senderContext: str | None = None


class AiPersonalizeResult(BaseModel):
    subject: str
    body: str


class AiCampaignInsightRequest(BaseModel):
    campaignName: str
    sent: int
    openRate: float
    clickRate: float
    replyRate: float
    bounceRate: float


class AiCampaignInsightResult(BaseModel):
    summary: str
    whatWorked: list[str]
    whatToImprove: list[str]


class EmbedTextsRequest(BaseModel):
    texts: list[str] = Field(min_length=1)


class EmbedTextsResult(BaseModel):
    # One vector per input text, same order — never faked, so a caller can
    # tell "this provider doesn't support embeddings" apart from "here's a
    # zero vector".
    vectors: list[list[float]]


class ResumeChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ResumeChatRequest(BaseModel):
    question: str = Field(min_length=1)
    # Prior turns, oldest first — this route is stateless, so the caller
    # resends whatever conversational context it wants considered.
    history: list[ResumeChatMessage] = Field(default_factory=list)


class ResumeChatResult(BaseModel):
    answer: str


class CareerFitRequest(BaseModel):
    resumeText: str = Field(min_length=1)
    # Optional — narrows the analysis toward a specific role rather than a general assessment.
    targetRole: str | None = None


class CareerFitApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side from the
    caller's own stored resume, never accepted from the client, so a caller
    can't feed the model arbitrary "resume" text and call it their own.
    """

    targetRole: str | None = None


class CareerFitResult(BaseModel):
    summary: str
    strengths: list[str]
    skillGaps: list[str]
    suggestedRoles: list[str]


class RoadmapResource(BaseModel):
    title: str
    type: Literal["documentation", "course", "book", "practice", "video", "article"]
    # Only ever populated for extremely well-known canonical pages (e.g. official docs
    # home pages) — the agent is instructed to leave this null rather than guess a URL.
    # Real video URLs are never emitted here at all — Node enriches "video" resources
    # with actual YouTube Data API results after this response comes back.
    url: str | None = None


class RoadmapStage(BaseModel):
    title: str
    topics: list[str]
    resources: list[RoadmapResource]
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None
    prerequisites: list[str] = Field(default_factory=list)
    # Set only when a resume was available for this generation; null otherwise.
    skillStatus: Literal["strong", "missing", "improve"] | None = None


class RoadmapRequest(BaseModel):
    # Empty when no resume is on file, or when the caller turned personalization off —
    # the roadmap still generates, just without resume-aware skill status.
    resumeText: str = ""
    goal: str = Field(min_length=1)


class RoadmapApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side, same reasoning as CareerFitApiRequest."""

    goal: str = Field(min_length=1)
    personalize: bool = True


class RoadmapResult(BaseModel):
    goal: str
    stages: list[RoadmapStage]
    detectedSkills: list[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    question: str
    category: Literal["behavioral", "technical", "system_design", "coding"]


class InterviewQuestionsRequest(BaseModel):
    resumeText: str = Field(min_length=1)
    targetRole: str | None = None


class InterviewQuestionsApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side, same reasoning as CareerFitApiRequest."""

    targetRole: str | None = None


class InterviewQuestionsResult(BaseModel):
    questions: list[InterviewQuestion]


class InterviewCoachMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class InterviewCoachRequest(BaseModel):
    resumeText: str = Field(min_length=1)
    message: str = Field(min_length=1)
    # Prior turns, oldest first — stateless, same as ResumeChatRequest.history.
    history: list[InterviewCoachMessage] = Field(default_factory=list)


class InterviewCoachApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side, same reasoning as CareerFitApiRequest."""

    message: str = Field(min_length=1)
    history: list[InterviewCoachMessage] = Field(default_factory=list)


class InterviewCoachResult(BaseModel):
    reply: str


EmploymentType = Literal["full_time", "part_time", "contract", "internship"]


class JobPostDraftRequest(BaseModel):
    roleTitle: str = Field(min_length=1)
    company: str = Field(min_length=1)
    # The recruiter's rough notes — the agent expands this into a full posting.
    briefDescription: str = Field(min_length=1)
    seniority: str | None = None


class JobPostDraftResult(BaseModel):
    title: str
    description: str
    skills: list[str]


ConfidenceLevel = Literal["high", "low"]
HiringTrend = Literal["growing", "stable", "contracting"]


class CompanyIntelConfidence(BaseModel):
    employeeCount: ConfidenceLevel = "low"
    techStack: ConfidenceLevel = "low"
    funding: ConfidenceLevel = "low"
    hiringTrend: ConfidenceLevel = "low"


class CompanyIntelRequest(BaseModel):
    company: str = Field(min_length=1)
    # Real public snippets (Wikipedia summary, site meta description) fetched
    # by Node — this agent only synthesizes structured fields from them, it
    # never searches the web itself.
    snippets: list[str] = Field(default_factory=list)


class CompanyIntelResult(BaseModel):
    employeeCount: int | None = None
    techStack: list[str] = Field(default_factory=list)
    funding: str | None = None
    hiringTrend: HiringTrend | None = None
    confidence: CompanyIntelConfidence = Field(default_factory=CompanyIntelConfidence)

    @field_validator("techStack", mode="before")
    @classmethod
    def _coerce_null_tech_stack(cls, v: list[str] | None) -> list[str]:
        # Models occasionally return null instead of [] despite the prompt's
        # instruction — coerced here rather than re-prompted, since an empty
        # list is exactly what null means in this field anyway.
        return v if v is not None else []


class OutreachDraftRequest(BaseModel):
    contactName: str = Field(min_length=1)
    roleTitle: str = Field(min_length=1)
    company: str = Field(min_length=1)
    # A real, verifiable fact computed server-side (tech-skill overlap, a company
    # milestone, or an honest "nothing distinguishing found yet") — never invented here.
    hook: str = Field(min_length=1)
    # The literal intersection of the candidate's own resume and this job's required
    # skills — never the candidate's missing/weak skills.
    matchingSkills: list[str] = Field(default_factory=list)
    candidateName: str | None = None
    includeCoverLetter: bool = False


class OutreachDraftResult(BaseModel):
    coldEmail: str
    linkedinNote: str
    coverLetter: str | None = None
