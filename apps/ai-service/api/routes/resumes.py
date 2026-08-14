from fastapi import APIRouter

from agents.embedding_agent import embed_texts
from api.dependencies import AuthorizedDep, DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.ai import EmbedTextsRequest, EmbedTextsResult, ResumeChatRequest, ResumeChatResult
from services.resume_chat_service import chat_about_resume_for_user

router = APIRouter(prefix="/ai/resumes", tags=["ai"])


@router.post("/embed", response_model=EmbedTextsResult)
async def embed_texts_route(
    body: EmbedTextsRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> EmbedTextsResult:
    return await embed_texts(settings, body)


@router.post("/chat", response_model=ResumeChatResult)
async def resume_chat_route(
    body: ResumeChatRequest, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> ResumeChatResult:
    return await chat_about_resume_for_user(settings, db, mongo_user_id, body)
