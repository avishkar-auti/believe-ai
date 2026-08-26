"""Any provider that speaks the OpenAI chat-completions wire format — Groq,
OpenAI itself, and most self-hosted gateways — shares this implementation;
only the base URL, key, and model differ.
"""

from __future__ import annotations

import httpx

from prompts.base import SYSTEM_INSTRUCTION
from prompts.career import (
    build_career_fit_prompt,
    build_interview_coach_prompt,
    build_interview_questions_prompt,
    build_resume_chat_prompt,
    build_roadmap_prompt,
    build_skill_extraction_prompt,
)
from prompts.design import build_design_edit_prompt, build_design_generate_prompt
from prompts.email import (
    build_campaign_insight_prompt,
    build_email_generation_prompt,
    build_improve_prompt,
    build_personalize_prompt,
)
from prompts.jobs import (
    build_company_intel_prompt,
    build_job_post_draft_prompt,
    build_outreach_draft_prompt,
    build_team_extraction_prompt,
)
from prompts.news import build_news_relevance_prompt
from prompts.notes import (
    build_note_flashcards_prompt,
    build_note_quiz_prompt,
    build_note_transcript_cleanup_prompt,
    build_note_transform_prompt,
    build_note_tutor_prompt,
    build_voice_command_prompt,
)
from prompts.profile import build_profile_summary_prompt
from prompts.rooms import build_room_questions_prompt, build_room_recap_prompt, build_room_summary_prompt
from prompts.template_chat import build_template_chat_prompt
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
    DesignEditRequest,
    DesignEditResult,
    DesignGenerateRequest,
    DesignGenerateResult,
    ImproveResult,
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
        embedding_requires_input_type: bool = False,
    ) -> None:
        self.id = provider_id
        self._base_url = base_url
        self._api_key = api_key
        self._model = model
        self._embedding_model = embedding_model
        self._timeout = timeout_seconds
        # Asymmetric embedding models (NVIDIA's QA-optimized ones) reject
        # embedding requests that omit input_type; symmetric ones (OpenAI,
        # Groq) don't accept the field at all, so this is opt-in per provider.
        self._embedding_requires_input_type = embedding_requires_input_type

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

    async def chat_about_template(self, req: TemplateChatRequest) -> TemplateChatResult:
        text = await self._chat(build_template_chat_prompt(req))
        return parse_and_validate_json(self.id, text, TemplateChatResult)

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

    async def extract_resume_skills(self, req: SkillExtractionRequest) -> SkillExtractionResult:
        text = await self._chat(build_skill_extraction_prompt(req))
        return parse_and_validate_json(self.id, text, SkillExtractionResult)

    async def build_roadmap(self, req: RoadmapRequest) -> RoadmapResult:
        text = await self._chat(build_roadmap_prompt(req))
        return parse_and_validate_json(self.id, text, RoadmapResult)

    async def generate_interview_questions(self, req: InterviewQuestionsRequest) -> InterviewQuestionsResult:
        text = await self._chat(build_interview_questions_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewQuestionsResult)

    async def generate_room_questions(self, req: RoomQuestionsRequest) -> RoomQuestionsResult:
        text = await self._chat(build_room_questions_prompt(req))
        return parse_and_validate_json(self.id, text, RoomQuestionsResult)

    async def generate_room_recap(self, req: RoomRecapRequest) -> RoomRecapResult:
        text = await self._chat(build_room_recap_prompt(req))
        return parse_and_validate_json(self.id, text, RoomRecapResult)

    async def generate_room_summary(self, req: RoomSummaryRequest) -> RoomSummaryResult:
        text = await self._chat(build_room_summary_prompt(req))
        return parse_and_validate_json(self.id, text, RoomSummaryResult)

    async def coach_interview(self, req: InterviewCoachRequest) -> InterviewCoachResult:
        text = await self._chat(build_interview_coach_prompt(req))
        return parse_and_validate_json(self.id, text, InterviewCoachResult)

    async def draft_job_post(self, req: JobPostDraftRequest) -> JobPostDraftResult:
        text = await self._chat(build_job_post_draft_prompt(req))
        return parse_and_validate_json(self.id, text, JobPostDraftResult)

    async def generate_profile_summary(self, req: ProfileSummaryRequest) -> ProfileSummaryResult:
        text = await self._chat(build_profile_summary_prompt(req))
        return parse_and_validate_json(self.id, text, ProfileSummaryResult)

    async def synthesize_company_intel(self, req: CompanyIntelRequest) -> CompanyIntelResult:
        text = await self._chat(build_company_intel_prompt(req))
        return parse_and_validate_json(self.id, text, CompanyIntelResult)

    async def extract_team_members(self, req: TeamExtractionRequest) -> TeamExtractionResult:
        text = await self._chat(build_team_extraction_prompt(req))
        return parse_and_validate_json(self.id, text, TeamExtractionResult)

    async def generate_outreach_draft(self, req: OutreachDraftRequest) -> OutreachDraftResult:
        text = await self._chat(build_outreach_draft_prompt(req))
        return parse_and_validate_json(self.id, text, OutreachDraftResult)

    async def generate_news_relevance(self, req: NewsRelevanceRequest) -> NewsRelevanceResult:
        text = await self._chat(build_news_relevance_prompt(req))
        return parse_and_validate_json(self.id, text, NewsRelevanceResult)

    async def transform_note_text(self, req: NoteTextTransformRequest) -> NoteTextTransformResult:
        text = await self._chat(build_note_transform_prompt(req))
        return parse_and_validate_json(self.id, text, NoteTextTransformResult)

    async def generate_note_quiz(self, req: NoteQuizRequest) -> NoteQuizResult:
        text = await self._chat(build_note_quiz_prompt(req))
        return parse_and_validate_json(self.id, text, NoteQuizResult)

    async def generate_note_flashcards(self, req: NoteFlashcardsRequest) -> NoteFlashcardsResult:
        text = await self._chat(build_note_flashcards_prompt(req))
        return parse_and_validate_json(self.id, text, NoteFlashcardsResult)

    async def chat_with_notes(self, req: NoteTutorRequest, context_chunks: list[str]) -> NoteTutorResult:
        text = await self._chat(build_note_tutor_prompt(req, context_chunks))
        return parse_and_validate_json(self.id, text, NoteTutorResult)

    async def cleanup_note_transcript(self, req: NoteTranscriptCleanupRequest) -> NoteTranscriptCleanupResult:
        text = await self._chat(build_note_transcript_cleanup_prompt(req))
        return parse_and_validate_json(self.id, text, NoteTranscriptCleanupResult)

    async def parse_voice_command(self, req: VoiceCommandRequest) -> VoiceCommandResult:
        text = await self._chat(build_voice_command_prompt(req))
        return parse_and_validate_json(self.id, text, VoiceCommandResult)

    async def generate_design_screen(self, req: DesignGenerateRequest) -> DesignGenerateResult:
        text = await self._chat(build_design_generate_prompt(req))
        return parse_and_validate_json(self.id, text, DesignGenerateResult)

    async def edit_design_screen(self, req: DesignEditRequest) -> DesignEditResult:
        text = await self._chat(build_design_edit_prompt(req))
        return parse_and_validate_json(self.id, text, DesignEditResult)

    async def embed_texts(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        # Groq has no embeddings endpoint — this 404s for it, and
        # with_fallback treats that exactly like any other capability failure.
        payload: dict[str, object] = {"model": self._embedding_model, "input": texts}
        if self._embedding_requires_input_type:
            payload["input_type"] = input_type or "passage"
            payload["truncate"] = "END"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                f"{self._base_url}/embeddings",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {self._api_key}"},
                json=payload,
            )

        if res.is_error:
            raise AiProviderError(f"{self.id} embedding request failed: {res.status_code} {res.text}")

        data = res.json()
        try:
            ordered = sorted(data["data"], key=lambda item: item["index"])
            return [item["embedding"] for item in ordered]
        except (KeyError, TypeError) as err:
            raise AiProviderError(f"{self.id} returned an unexpected embedding response") from err
