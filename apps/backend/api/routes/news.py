"""Resume-personalized news feed — reads the caller's own resume server-side,
same reasoning as career.py; the client can only choose mode/query/pageSize,
never a resumeText or user_id."""

from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.ai import NewsFeedApiRequest, NewsFeedResult
from services.news_service import get_news_feed

router = APIRouter(prefix="/news", tags=["news"])


@router.post("/feed", response_model=NewsFeedResult)
async def news_feed_route(
    body: NewsFeedApiRequest, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> NewsFeedResult:
    return await get_news_feed(settings, db, mongo_user_id, body.mode, body.query, body.pageSize)
