from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from schemas.user_context import UpdateUserContextInput, UserContextDto
from services.user_context_service import get_user_context, update_user_context

router = APIRouter(prefix="/profile/context", tags=["profile"])


@router.get("/", response_model=UserContextDto | None)
async def get_user_context_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> UserContextDto | None:
    return await get_user_context(mongo_user_id)


@router.put("/", response_model=UserContextDto)
async def update_user_context_route(
    body: UpdateUserContextInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> UserContextDto:
    return await update_user_context(mongo_user_id, body)
