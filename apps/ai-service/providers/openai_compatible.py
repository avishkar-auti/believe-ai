"""Any provider that speaks the OpenAI chat-completions wire format — Groq,
OpenAI itself, and most self-hosted gateways — shares this implementation;
only the base URL, key, and model differ.
"""

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


class OpenAiCompatibleProvider:
    def __init__(
        self,
        provider_id: str,
        base_url: str,
        api_key: str,
        model: str,
        embedding_model: str,
        timeout_seconds: float,
    ) -> None:
        self.id = provider_id
        self._base_url = base_url
        self._api_key = api_key
        self._model = model
        self._embedding_model = embedding_model
        self._timeout = timeout_seconds

    async def _chat(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                f"{self._base_url}/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {self._api_key}"},
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                    "response_format": {"type": "json_object"},
                },
            )

        if res.is_error:
            raise AiProviderError(f"{self.id} request failed: {res.status_code} {res.text}")

        data = res.json()
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as err:
            raise AiProviderError(f"{self.id} returned an empty response") from err
        if not text:
            raise AiProviderError(f"{self.id} returned an empty response")
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
        # Groq has no embeddings endpoint — this 404s for it, and
        # with_fallback treats that exactly like any other capability failure.
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                f"{self._base_url}/embeddings",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {self._api_key}"},
                json={"model": self._embedding_model, "input": texts},
            )

        if res.is_error:
            raise AiProviderError(f"{self.id} embedding request failed: {res.status_code} {res.text}")

        data = res.json()
        try:
            ordered = sorted(data["data"], key=lambda item: item["index"])
            return [item["embedding"] for item in ordered]
        except (KeyError, TypeError) as err:
            raise AiProviderError(f"{self.id} returned an unexpected embedding response") from err
