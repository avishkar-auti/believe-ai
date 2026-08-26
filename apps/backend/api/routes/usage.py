from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, UserIdDep
from schemas.usage import PlanUsage
from services.usage_service import get_usage

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/", response_model=PlanUsage)
async def get_usage_route(db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> PlanUsage:
    return await get_usage(db, mongo_user_id)
