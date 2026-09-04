"""Real-data routes: operate on the caller's own stored resume, not a
resumeText the client could otherwise pass in directly."""

from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.ai import CareerFitApiRequest, CareerFitResult, RoadmapApiRequest, RoadmapResult
from services.career_fit_service import analyze_career_fit_for_user
from services.roadmap_service import build_roadmap_for_user

router = APIRouter(prefix="/career", tags=["career"])


@router.post("/fit", response_model=CareerFitResult)
async def career_fit_route(
    body: CareerFitApiRequest, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> CareerFitResult:
    return await analyze_career_fit_for_user(settings, db, mongo_user_id, body.targetRole, body.resumeId)


@router.post("/roadmap", response_model=RoadmapResult)
async def roadmap_route(
    body: RoadmapApiRequest, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> RoadmapResult:
    return await build_roadmap_for_user(settings, db, mongo_user_id, body.goal, body.personalize, body.resumeId)
