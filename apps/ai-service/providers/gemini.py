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


class GeminiProvider:
    id = "gemini"

    def __init__(self, api_key: str, model: str, embedding_model: str, timeout_seconds: float) -> None:
        self._api_key = api_key
        self._model = model
        self._embedding_model = embedding_model
        self._timeout = timeout_seconds

    async def _generate(self, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                url,
                headers={"Content-Type": "application/json", "X-goog-api-key": self._api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                    "generationConfig": {"responseMimeType": "application/json"},
                },
            )

        if res.is_error:
            raise AiProviderError(f"Gemini request failed: {res.status_code} {res.text}")

        data = res.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as err:
            raise AiProviderError("Gemini returned an empty response") from err
        if not text:
            raise AiProviderError("Gemini returned an empty response")
        return text

    async def generate_email(self, req: AiEmailGenerationRequest) -> AiEmailGenerationResult:
        text = await self._generate(build_email_generation_prompt(req))
        return parse_and_validate_json(self.id, text, AiEmailGenerationResult)

    async def improve_email(self, req: AiImproveRequest) -> ImproveResult:
        text = await self._generate(build_improve_prompt(req))
        return parse_and_validate_json(self.id, text, ImproveResult)

    async def personalize_email(self, req: AiPersonalizeRequest) -> AiPersonalizeResult:
        text = await self._generate(build_personalize_prompt(req))
        return parse_and_validate_json(self.id, text, AiPersonalizeResult)

    async def analyze_campaign(self, req: AiCampaignInsightRequest) -> AiCampaignInsightResult:
        text = await self._generate(build_campaign_insight_prompt(req))
        return parse_and_validate_json(self.id, text, AiCampaignInsightResult)

    async def chat_about_resume(self, req: ResumeChatRequest, context_chunks: list[str]) -> ResumeChatResult:
        text = await self._generate(build_resume_chat_prompt(req, context_chunks))
        return parse_and_validate_json(self.id, text, ResumeChatResult)

    async def analyze_career_fit(self, req: CareerFitRequest) -> CareerFitResult:
        text = await self._generate(build_career_fit_prompt(req))
        return parse_and_validate_json(self.id, text, CareerFitResult)

    async def build_roadmap(self, req: RoadmapRequest) -> RoadmapResult:
        text = await self._generate(build_roadmap_prompt(req))
        return parse_and_validate_json(self.id, text, RoadmapResult)

    async def generate_interview_questions(self, req: InterviewQuestionsRequest) -> InterviewQuestionsResult:
        text = await self._generate(build_interview_questions_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewQuestionsResult)

    async def coach_interview(self, req: InterviewCoachRequest) -> InterviewCoachResult:
        text = await self._generate(build_interview_coach_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewCoachResult)

    async def draft_job_post(self, req: JobPostDraftRequest) -> JobPostDraftResult:
        text = await self._generate(build_job_post_draft_prompt(req))
        return parse_and_validate_json(self.id, text, JobPostDraftResult)

    async def synthesize_company_intel(self, req: CompanyIntelRequest) -> CompanyIntelResult:
        text = await self._generate(build_company_intel_prompt(req))
        return parse_and_validate_json(self.id, text, CompanyIntelResult)

    async def generate_outreach_draft(self, req: OutreachDraftRequest) -> OutreachDraftResult:
        text = await self._generate(build_outreach_draft_prompt(req))
        return parse_and_validate_json(self.id, text, OutreachDraftResult)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self._embedding_model}:batchEmbedContents"
        )
        requests = [
            {"model": f"models/{self._embedding_model}", "content": {"parts": [{"text": text}]}} for text in texts
        ]
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                url,
                headers={"Content-Type": "application/json", "X-goog-api-key": self._api_key},
                json={"requests": requests},
            )

        if res.is_error:
            raise AiProviderError(f"Gemini embedding request failed: {res.status_code} {res.text}")

        data = res.json()
        try:
            return [item["values"] for item in data["embeddings"]]
        except (KeyError, TypeError) as err:
            raise AiProviderError("Gemini returned an unexpected embedding response") from err
