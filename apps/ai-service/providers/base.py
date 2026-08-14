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
    ImproveResult,
    InterviewCoachRequest,
    InterviewCoachResult,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
    JobPostDraftRequest,
    JobPostDraftResult,
    OutreachDraftRequest,
    OutreachDraftResult,
    ResumeChatRequest,
    ResumeChatResult,
    RoadmapRequest,
    RoadmapResult,
)


class AiProvider(Protocol):
    id: str

    async def generate_email(self, req: AiEmailGenerationRequest) -> AiEmailGenerationResult: ...

    async def improve_email(self, req: AiImproveRequest) -> ImproveResult: ...

    async def personalize_email(self, req: AiPersonalizeRequest) -> AiPersonalizeResult: ...

    async def analyze_campaign(self, req: AiCampaignInsightRequest) -> AiCampaignInsightResult: ...

    async def chat_about_resume(self, req: ResumeChatRequest, context_chunks: list[str]) -> ResumeChatResult: ...

    async def analyze_career_fit(self, req: CareerFitRequest) -> CareerFitResult: ...

    async def build_roadmap(self, req: RoadmapRequest) -> RoadmapResult: ...

    async def generate_interview_questions(self, req: InterviewQuestionsRequest) -> InterviewQuestionsResult: ...

    async def coach_interview(self, req: InterviewCoachRequest) -> InterviewCoachResult: ...

    async def draft_job_post(self, req: JobPostDraftRequest) -> JobPostDraftResult: ...

    async def synthesize_company_intel(self, req: CompanyIntelRequest) -> CompanyIntelResult: ...

    async def generate_outreach_draft(self, req: OutreachDraftRequest) -> OutreachDraftResult: ...

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Not every backend has an embeddings endpoint (Groq has none at
        all); such providers raise AiProviderError immediately so
        with_fallback moves on to the next provider exactly like any other
        capability failure — no separate embedding-provider list needed.
        """
        ...
