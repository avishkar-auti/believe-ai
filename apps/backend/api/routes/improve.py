from fastapi import APIRouter

from agents.improvement_agent import improve_email
from api.dependencies import SettingsDep, UserIdDep
from schemas.ai import AiImproveRequest, ImproveResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/improve", response_model=ImproveResult)
async def improve_email_route(body: AiImproveRequest, settings: SettingsDep, _user_id: UserIdDep) -> ImproveResult:
    return await improve_email(settings, body)
