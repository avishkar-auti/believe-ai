from fastapi import APIRouter

from agents.personalization_agent import personalize_email
from api.dependencies import SettingsDep, UserIdDep
from schemas.ai import AiPersonalizeRequest, AiPersonalizeResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/personalize", response_model=AiPersonalizeResult)
async def personalize_email_route(
    body: AiPersonalizeRequest, settings: SettingsDep, _user_id: UserIdDep
) -> AiPersonalizeResult:
    return await personalize_email(settings, body)
