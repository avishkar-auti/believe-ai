from fastapi import APIRouter

from agents.improvement_agent import improve_email
from api.dependencies import AuthorizedDep, SettingsDep
from schemas.ai import AiImproveRequest, ImproveResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/improve", response_model=ImproveResult)
async def improve_email_route(body: AiImproveRequest, settings: SettingsDep, _caller: AuthorizedDep) -> ImproveResult:
    return await improve_email(settings, body)
