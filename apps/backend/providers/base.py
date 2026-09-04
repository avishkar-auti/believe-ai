"""Every AI backend (Gemini, Groq, OpenAI, Ollama, ...) implements this
protocol. The orchestrator (agents/*) never talks to a provider SDK
directly — only this contract — so adding a provider never touches the
agents or routes.
"""

from __future__ import annotations

from typing import Protocol

from schemas.ai import (
    AiCampaignInsightRequest,
    AiCampaignInsightResult,
    AiEmailGenerationRequest,
    AiEmailGenerationResult,
    AiImproveRequest,
    AiPersonalizeRequest,
    AiPersonalizeResult,
    CareerFitRequest,
    CareerFitResult,
    CompanyIntelRequest,
    CompanyIntelResult,
    DesignEditRequest,
    DesignEditResult,
    DesignGenerateRequest,
    DesignGenerateResult,
    DesignPromptEnhanceRequest,
    DesignPromptEnhanceResult,
    ImproveResult,
    InterviewAnswerFeedbackRequest,
    InterviewAnswerFeedbackResult,
    InterviewCoachRequest,
    InterviewCoachResult,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
    JobPostDraftRequest,
    JobPostDraftResult,
    NewsRelevanceRequest,
    NewsRelevanceResult,
    NoteFlashcardsRequest,
    NoteFlashcardsResult,
    NoteQuizRequest,
    NoteQuizResult,
    NoteTextTransformRequest,
    NoteTextTransformResult,
    NoteTranscriptCleanupRequest,
    NoteTranscriptCleanupResult,
    NoteTutorRequest,
    NoteTutorResult,
    OutreachDraftRequest,
    OutreachDraftResult,
    ProfileSummaryRequest,
    ProfileSummaryResult,
    ResumeChatRequest,
    ResumeChatResult,
    RoadmapRequest,
    RoadmapResult,
    RoomQuestionsRequest,
    RoomQuestionsResult,
    RoomRecapRequest,
    RoomRecapResult,
    RoomSummaryRequest,
    RoomSummaryResult,
    SkillExtractionRequest,
    SkillExtractionResult,
    TeamExtractionRequest,
    TeamExtractionResult,
    TemplateChatRequest,
    TemplateChatResult,
    VoiceCommandRequest,
    VoiceCommandResult,
)


class AiProvider(Protocol):
    id: str

    async def generate_email(self, req: AiEmailGenerationRequest) -> AiEmailGenerationResult: ...

    async def improve_email(self, req: AiImproveRequest) -> ImproveResult: ...

    async def chat_about_template(self, req: TemplateChatRequest) -> TemplateChatResult: ...

    async def personalize_email(self, req: AiPersonalizeRequest) -> AiPersonalizeResult: ...

    async def analyze_campaign(self, req: AiCampaignInsightRequest) -> AiCampaignInsightResult: ...

    async def chat_about_resume(self, req: ResumeChatRequest, context_chunks: list[str]) -> ResumeChatResult: ...

    async def analyze_career_fit(self, req: CareerFitRequest) -> CareerFitResult: ...

    async def extract_resume_skills(self, req: SkillExtractionRequest) -> SkillExtractionResult: ...

    async def build_roadmap(self, req: RoadmapRequest) -> RoadmapResult: ...

    async def generate_interview_questions(self, req: InterviewQuestionsRequest) -> InterviewQuestionsResult: ...

    async def generate_room_questions(self, req: RoomQuestionsRequest) -> RoomQuestionsResult: ...

    async def generate_room_recap(self, req: RoomRecapRequest) -> RoomRecapResult: ...

    async def generate_room_summary(self, req: RoomSummaryRequest) -> RoomSummaryResult: ...

    async def coach_interview(self, req: InterviewCoachRequest) -> InterviewCoachResult: ...

    async def analyze_interview_answer(self, req: InterviewAnswerFeedbackRequest) -> InterviewAnswerFeedbackResult: ...

    async def draft_job_post(self, req: JobPostDraftRequest) -> JobPostDraftResult: ...

    async def synthesize_company_intel(self, req: CompanyIntelRequest) -> CompanyIntelResult: ...

    async def generate_outreach_draft(self, req: OutreachDraftRequest) -> OutreachDraftResult: ...

    async def extract_team_members(self, req: TeamExtractionRequest) -> TeamExtractionResult: ...

    async def generate_news_relevance(self, req: NewsRelevanceRequest) -> NewsRelevanceResult: ...

    async def generate_profile_summary(self, req: ProfileSummaryRequest) -> ProfileSummaryResult: ...

    async def transform_note_text(self, req: NoteTextTransformRequest) -> NoteTextTransformResult: ...

    async def generate_note_quiz(self, req: NoteQuizRequest) -> NoteQuizResult: ...

    async def generate_note_flashcards(self, req: NoteFlashcardsRequest) -> NoteFlashcardsResult: ...

    async def chat_with_notes(self, req: NoteTutorRequest, context_chunks: list[str]) -> NoteTutorResult: ...

    async def cleanup_note_transcript(self, req: NoteTranscriptCleanupRequest) -> NoteTranscriptCleanupResult: ...

    async def parse_voice_command(self, req: VoiceCommandRequest) -> VoiceCommandResult: ...

    async def generate_design_screen(self, req: DesignGenerateRequest) -> DesignGenerateResult: ...

    async def edit_design_screen(self, req: DesignEditRequest) -> DesignEditResult: ...

    async def enhance_design_prompt(self, req: DesignPromptEnhanceRequest) -> DesignPromptEnhanceResult: ...

    async def embed_texts(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        """Not every backend has an embeddings endpoint (Groq has none at
        all); such providers raise AiProviderError immediately so
        with_fallback moves on to the next provider exactly like any other
        capability failure — no separate embedding-provider list needed.
        `input_type` ("query" | "passage") only matters to asymmetric
        embedding models; symmetric providers ignore it.
        """
        ...
