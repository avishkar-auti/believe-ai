from fastapi import APIRouter

from agents.email_writer_agent import generate_email
from api.dependencies import AuthorizedDep, SettingsDep
from schemas.ai import AiEmailGenerationRequest, AiEmailGenerationResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/email", response_model=AiEmailGenerationResult)
async def generate_email_route(
    body: AiEmailGenerationRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> AiEmailGenerationResult:
    return await generate_email(settings, body)
