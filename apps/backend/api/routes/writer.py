from fastapi import APIRouter

from agents.email_writer_agent import generate_email
from agents.template_chat_agent import chat_about_template
from api.dependencies import SettingsDep, UserIdDep
from schemas.ai import AiEmailGenerationRequest, AiEmailGenerationResult, TemplateChatRequest, TemplateChatResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/email", response_model=AiEmailGenerationResult)
async def generate_email_route(
    body: AiEmailGenerationRequest, settings: SettingsDep, _user_id: UserIdDep
) -> AiEmailGenerationResult:
    return await generate_email(settings, body)


@router.post("/template-chat", response_model=TemplateChatResult)
async def template_chat_route(
    body: TemplateChatRequest, settings: SettingsDep, _user_id: UserIdDep
) -> TemplateChatResult:
    return await chat_about_template(settings, body)
