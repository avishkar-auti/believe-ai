from __future__ import annotations

import httpx

from prompts.templates import (
    SYSTEM_INSTRUCTION,
    build_campaign_insight_prompt,
    build_career_fit_prompt,
    build_company_intel_prompt,
    build_email_generation_prompt,
    build_improve_prompt,
    build_interview_coach_prompt,
    build_interview_questions_prompt,
    build_job_post_draft_prompt,
    build_outreach_draft_prompt,
    build_personalize_prompt,
    build_resume_chat_prompt,
    build_roadmap_prompt,
)
from providers.errors import AiProviderError
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
from utils.parse_json import parse_and_validate_json


class OllamaProvider:
    id = "ollama"

    def __init__(self, base_url: str, model: str, embedding_model: str | None, timeout_seconds: float) -> None:
        self._base_url = base_url
        self._model = model
        self._embedding_model = embedding_model
        self._timeout = timeout_seconds

    async def _chat(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "stream": False,
                    "format": "json",
                    "messages": [
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                },
            )

        if res.is_error:
            raise AiProviderError(f"Ollama request failed: {res.status_code} {res.text}")

        data = res.json()
        text = (data.get("message") or {}).get("content")
        if not text:
            raise AiProviderError("Ollama returned an empty response")
        return text

    async def generate_email(self, req: AiEmailGenerationRequest) -> AiEmailGenerationResult:
        text = await self._chat(build_email_generation_prompt(req))
        return parse_and_validate_json(self.id, text, AiEmailGenerationResult)

    async def improve_email(self, req: AiImproveRequest) -> ImproveResult:
        text = await self._chat(build_improve_prompt(req))
        return parse_and_validate_json(self.id, text, ImproveResult)

    async def personalize_email(self, req: AiPersonalizeRequest) -> AiPersonalizeResult:
        text = await self._chat(build_personalize_prompt(req))
        return parse_and_validate_json(self.id, text, AiPersonalizeResult)

    async def analyze_campaign(self, req: AiCampaignInsightRequest) -> AiCampaignInsightResult:
        text = await self._chat(build_campaign_insight_prompt(req))
        return parse_and_validate_json(self.id, text, AiCampaignInsightResult)

    async def chat_about_resume(self, req: ResumeChatRequest, context_chunks: list[str]) -> ResumeChatResult:
        text = await self._chat(build_resume_chat_prompt(req, context_chunks))
        return parse_and_validate_json(self.id, text, ResumeChatResult)

    async def analyze_career_fit(self, req: CareerFitRequest) -> CareerFitResult:
        text = await self._chat(build_career_fit_prompt(req))
        return parse_and_validate_json(self.id, text, CareerFitResult)

    async def build_roadmap(self, req: RoadmapRequest) -> RoadmapResult:
        text = await self._chat(build_roadmap_prompt(req))
        return parse_and_validate_json(self.id, text, RoadmapResult)

    async def generate_interview_questions(self, req: InterviewQuestionsRequest) -> InterviewQuestionsResult:
        text = await self._chat(build_interview_questions_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewQuestionsResult)

    async def coach_interview(self, req: InterviewCoachRequest) -> InterviewCoachResult:
        text = await self._chat(build_interview_coach_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewCoachResult)

    async def draft_job_post(self, req: JobPostDraftRequest) -> JobPostDraftResult:
        text = await self._chat(build_job_post_draft_prompt(req))
        return parse_and_validate_json(self.id, text, JobPostDraftResult)

    async def synthesize_company_intel(self, req: CompanyIntelRequest) -> CompanyIntelResult:
        text = await self._chat(build_company_intel_prompt(req))
        return parse_and_validate_json(self.id, text, CompanyIntelResult)

    async def generate_outreach_draft(self, req: OutreachDraftRequest) -> OutreachDraftResult:
        text = await self._chat(build_outreach_draft_prompt(req))
        return parse_and_validate_json(self.id, text, OutreachDraftResult)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self._embedding_model:
            raise AiProviderError("Ollama has no OLLAMA_EMBEDDING_MODEL configured")

        # Ollama's /api/embeddings takes one prompt at a time — fine for a
        # local/offline fallback, not a hot path.
        vectors: list[list[float]] = []
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for text in texts:
                res = await client.post(
                    f"{self._base_url}/api/embeddings",
                    json={"model": self._embedding_model, "prompt": text},
                )
                if res.is_error:
                    raise AiProviderError(f"Ollama embedding request failed: {res.status_code} {res.text}")
                embedding = res.json().get("embedding")
                if not embedding:
                    raise AiProviderError("Ollama returned an empty embedding")
                vectors.append(embedding)
        return vectors
