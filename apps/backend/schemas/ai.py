"""Pydantic request/response models — mirror packages/shared/src/types/ai.ts
and schemas/ai.schema.ts so the two services agree on the wire format.
"""

from __future__ import annotations

from typing import Any, Literal

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ValidationInfo, field_validator

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


class TemplateChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TemplateChatRequest(BaseModel):
    message: str = Field(min_length=1)
    # Prior turns, oldest first — stateless, same as ResumeChatRequest.history.
    history: list[TemplateChatMessage] = Field(default_factory=list)
    # The draft as it stands before this turn — null/empty on the first message,
    # when the agent creates a template from scratch instead of editing one.
    currentSubject: str | None = None
    currentBody: str | None = None


class TemplateChatResult(BaseModel):
    reply: str
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
    # Asymmetric embedding models (e.g. NVIDIA's QA-optimized models) embed a
    # search query and the passages it's matched against differently. Ignored
    # by providers whose embeddings are symmetric; defaults to "passage"
    # since that's the majority call site (resume-chunk ingestion).
    input_type: Literal["query", "passage"] | None = None


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
    # Which resume to search — defaults to whichever is Primary when omitted.
    resumeId: PydanticObjectId | None = None


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
    resumeId: PydanticObjectId | None = None


class CareerFitResult(BaseModel):
    """fitScore is a real, LLM-scored judgment (mirrors
    InterviewAnswerFeedbackResult.overallScore below) — never derived
    client-side from list lengths, which produced a narrow, uninformative
    band clustered around 50% regardless of actual fit."""

    summary: str
    strengths: list[str]
    skillGaps: list[str]
    suggestedRoles: list[str]
    fitScore: int = Field(ge=0, le=100)


class SkillExtractionRequest(BaseModel):
    """Career Fit's skill-identification step, narrow enough to be reusable
    outside a full fit assessment — see agents/career_fit_agent.py's
    extract_resume_skills, invoked by News' relevance generation too."""

    resumeText: str = Field(min_length=1)
    targetRole: str | None = None


class SkillExtractionResult(BaseModel):
    skills: list[str]


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
    resumeId: PydanticObjectId | None = None


class RoadmapResult(BaseModel):
    goal: str
    stages: list[RoadmapStage]
    detectedSkills: list[str] = Field(default_factory=list)


InterviewQuestionCategory = Literal["behavioral", "technical", "system_design", "coding"]
# None/"mixed" both mean "generate a mix of categories" — see build_interview_questions_prompt.
InterviewType = Literal["technical", "behavioral", "system_design", "coding", "mixed"]
InterviewDifficulty = Literal["easy", "medium", "hard"]


class InterviewQuestion(BaseModel):
    question: str
    category: InterviewQuestionCategory


class InterviewQuestionsRequest(BaseModel):
    resumeText: str = Field(min_length=1)
    targetRole: str | None = None
    interviewType: InterviewType | None = None
    difficulty: InterviewDifficulty | None = None
    # Optional job-posting context — set when a session is started from a
    # specific Job Board listing, so questions can probe that role directly
    # instead of only the free-text targetRole. None for every other caller.
    jobTitle: str | None = None
    jobCompany: str | None = None
    jobDescription: str | None = None


class InterviewQuestionsApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side, same reasoning as CareerFitApiRequest."""

    targetRole: str | None = None
    interviewType: InterviewType | None = None
    difficulty: InterviewDifficulty | None = None
    resumeId: PydanticObjectId | None = None
    jobTitle: str | None = None
    jobCompany: str | None = None
    jobDescription: str | None = None


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
    resumeId: PydanticObjectId | None = None


class InterviewCoachResult(BaseModel):
    reply: str


class InterviewAnswerFeedbackRequest(BaseModel):
    resumeText: str = Field(min_length=1)
    question: str = Field(min_length=1)
    category: InterviewQuestionCategory
    answer: str = Field(min_length=1)
    targetRole: str | None = None


class InterviewAnswerFeedbackApiRequest(BaseModel):
    """Route-level body — resumeText is filled in server-side, same reasoning as CareerFitApiRequest."""

    question: str = Field(min_length=1)
    category: InterviewQuestionCategory
    answer: str = Field(min_length=1)
    targetRole: str | None = None
    resumeId: PydanticObjectId | None = None


class InterviewAnswerFeedbackResult(BaseModel):
    """A real, LLM-scored rubric for one answer — never client-side math, so
    every number here reflects an actual model judgment grounded in the
    resume and the question, not a fabricated placeholder."""

    overallScore: int = Field(ge=0, le=100)
    technicalAccuracy: int = Field(ge=0, le=100)
    clarity: int = Field(ge=0, le=100)
    depth: int = Field(ge=0, le=100)
    communication: int = Field(ge=0, le=100)
    strengths: list[str]
    improvements: list[str]
    suggestedAnswer: str


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


class TeamExtractionRequest(BaseModel):
    company: str = Field(min_length=1)
    # Raw text from the company's own public team/about page — the model only
    # ever extracts people explicitly named in this text, never invents anyone.
    pageText: str = Field(min_length=1)


class TeamMemberExtract(BaseModel):
    name: str
    title: str | None = None


class TeamExtractionResult(BaseModel):
    members: list[TeamMemberExtract] = Field(default_factory=list)


OutreachDraftIntent = Literal["outreach", "referral"]


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
    # "referral" assumes an existing connection and asks for a referral instead
    # of the standard cold-email/connection-note pair — see
    # prompts/jobs.py::build_outreach_draft_prompt.
    intent: OutreachDraftIntent = "outreach"


class OutreachDraftResult(BaseModel):
    coldEmail: str
    linkedinNote: str
    # Only populated when the request's intent is "referral" — null otherwise.
    referralRequest: str | None = None


class RoomQuestionsRequest(BaseModel):
    """Open-ended discussion prompts for a peer practice room — unlike
    InterviewQuestionsRequest these are never grounded in one person's resume,
    since a room has several participants with different backgrounds."""

    topic: str | None = None
    targetRole: str | None = None
    participantCount: int = Field(ge=1, le=6)


class RoomQuestionsResult(BaseModel):
    questions: list[str]


class RoomRecapRequest(BaseModel):
    """Rolling summary of a peer practice room's progress, built from recent
    shared-idea-board notes and (if any) browser-STT transcript snippets.
    Both inputs are optional and often sparse — the recap must degrade
    gracefully rather than invent content when little has been captured."""

    topic: str | None = None
    currentQuestionText: str | None = None
    recentIdeas: list[str] = Field(default_factory=list)
    recentTranscript: list[str] = Field(default_factory=list)


class RoomRecapResult(BaseModel):
    recap: str


class RoomSummaryParticipant(BaseModel):
    userId: str
    name: str


class RoomSummaryRequest(BaseModel):
    """Full post-call synthesis input for a peer practice room — a group
    summary plus one strength/growth-area note per participant, built from
    everything captured during the session (ideas, peer feedback comments,
    and any browser-STT transcript)."""

    topic: str | None = None
    participants: list[RoomSummaryParticipant]
    questions: list[str] = Field(default_factory=list)
    ideas: list[str] = Field(default_factory=list)
    feedbackComments: list[str] = Field(default_factory=list)
    transcript: list[str] = Field(default_factory=list)


class RoomSummaryPerStudent(BaseModel):
    userId: str
    name: str
    strength: str
    growthArea: str


class RoomSummaryResult(BaseModel):
    groupSummary: str
    perStudent: list[RoomSummaryPerStudent]


NewsMode = Literal["resume", "search"]


class NewsRelevanceArticleInput(BaseModel):
    url: str
    title: str
    description: str | None = None


class NewsRelevanceRequest(BaseModel):
    """Batched, not one call per article — every article's reason is
    generated in a single request so an 8-article feed costs one LLM call,
    not eight."""

    queryText: str = Field(min_length=1)
    articles: list[NewsRelevanceArticleInput] = Field(min_length=1)
    # Resume mode only — from Career Fit's skill-extraction subroutine
    # (agents/career_fit_agent.extract_resume_skills), so reasoning can name
    # the reader's actual skills instead of paraphrasing queryText.
    skills: list[str] | None = None


class NewsRelevanceReason(BaseModel):
    url: str
    why: str


class NewsRelevanceResult(BaseModel):
    reasons: list[NewsRelevanceReason]


class ScoredArticle(BaseModel):
    title: str
    description: str | None = None
    url: str
    source: str
    publishedAt: str | None = None
    # None when the embedding step itself failed (provider outage) rather than
    # just scoring low — lets the frontend distinguish "unscored" from "0% match".
    embeddingScore: float | None = None
    relevanceScore: float | None = None
    # Best-effort grounded reasoning from generate_news_relevance — null when
    # that generation step failed or hasn't run; never blocks the feed itself.
    whyRelevant: str | None = None


class NewsFeedApiRequest(BaseModel):
    """Route-level body — mode="resume" reads the caller's own stored resume
    server-side (never a resumeText or user_id the client could pass in
    directly), same reasoning as CareerFitApiRequest."""

    mode: NewsMode
    query: str | None = None
    pageSize: int = Field(default=8, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def _query_present_for_search(cls, value: str | None, info: ValidationInfo) -> str | None:
        if info.data.get("mode") == "search" and not (value or "").strip():
            raise ValueError("query is required for search mode")
        return value


class NewsFeedResult(BaseModel):
    articles: list[ScoredArticle]
    mode: NewsMode
    queryUsed: str


class ProfileSummaryRequest(BaseModel):
    """Grounds the generated one-line summary strictly in what the caller has
    already told the app about themselves — the public-profile headline/bio
    fields being edited, plus the existing Believe Profile (UserContext)
    fields already used for outreach personalization. Never a resumeText or
    other free-form injection point."""

    name: str = Field(min_length=1)
    headline: str | None = None
    jobTitle: str | None = None
    company: str | None = None
    bio: str | None = None
    aboutMe: str | None = None
    skillsAndExperience: str | None = None
    achievements: str | None = None


class ProfileSummaryResult(BaseModel):
    summary: str


NoteTransformAction = Literal["explain", "simplify", "summarize", "fix_grammar", "generate_example", "extract_action_items"]


class NoteTextTransformRequest(BaseModel):
    text: str = Field(min_length=1)
    action: NoteTransformAction


class NoteTextTransformResult(BaseModel):
    result: str


class NoteQuizRequest(BaseModel):
    noteTitle: str
    noteText: str = Field(min_length=1)
    questionCount: int = Field(default=5, ge=1, le=15)


class NoteQuizQuestion(BaseModel):
    question: str
    options: list[str]
    correctIndex: int
    explanation: str | None = None


class NoteQuizResult(BaseModel):
    questions: list[NoteQuizQuestion]


class NoteFlashcardsRequest(BaseModel):
    noteTitle: str
    noteText: str = Field(min_length=1)
    cardCount: int = Field(default=8, ge=1, le=20)


class NoteFlashcard(BaseModel):
    front: str
    back: str


class NoteFlashcardsResult(BaseModel):
    cards: list[NoteFlashcard]


class NoteChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class NoteTutorRequest(BaseModel):
    question: str = Field(min_length=1)
    history: list[NoteChatMessage] = Field(default_factory=list)


class NoteTutorResult(BaseModel):
    answer: str


class NoteTranscriptCleanupRequest(BaseModel):
    rawTranscript: str = Field(min_length=1)


class NoteTranscriptCleanupResult(BaseModel):
    title: str
    # Markdown — headings/lists/bold/etc. The frontend parses this into the
    # editor's document format rather than the model emitting editor-specific JSON.
    markdown: str


VoiceCommandType = Literal["create_note", "add_section", "summarize", "generate_questions", "none"]


class VoiceCommandRequest(BaseModel):
    transcript: str = Field(min_length=1)
    # Tells the model whether "add a section"/"summarize this" is even actionable right
    # now — those only make sense with a note open, unlike "create a note called X".
    hasActiveNote: bool


class VoiceCommandResult(BaseModel):
    # "none" means this is just dictated note content, not an instruction to the assistant.
    commandType: VoiceCommandType
    noteTitle: str | None = None
    sectionTitle: str | None = None
    questionCount: int | None = Field(default=None, ge=1, le=15)


DesignPlatform = Literal["web", "mobile"]


class DesignGenerateRequest(BaseModel):
    prompt: str = Field(min_length=1)
    platform: DesignPlatform


class DesignGenerateResult(BaseModel):
    title: str
    # A DesignNode tree — validated structurally by the frontend renderer (unknown
    # node types/fields are safely skipped there), not by a rigid backend schema,
    # since the DSL's own vocabulary is deliberately small and stable for v1.
    dsl: dict[str, Any]


class DesignEditRequest(BaseModel):
    currentDsl: dict[str, Any]
    instruction: str = Field(min_length=1)


class DesignEditResult(BaseModel):
    dsl: dict[str, Any]


class DesignPromptEnhanceRequest(BaseModel):
    prompt: str = Field(min_length=1)
    platform: DesignPlatform


class DesignPromptEnhanceResult(BaseModel):
    enhancedPrompt: str
