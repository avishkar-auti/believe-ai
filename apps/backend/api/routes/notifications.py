from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from schemas.notification import MarkAllReadResult, NotificationDto, NotificationListResult
from schemas.pagination import DEFAULT_PAGE_SIZE
from services.notification_service import list_notifications, mark_all_read, mark_read

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=NotificationListResult)
async def list_notifications_route(
    mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> NotificationListResult:
    return await list_notifications(mongo_user_id, page, limit)


@router.post("/read-all", response_model=MarkAllReadResult)
async def mark_all_read_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> MarkAllReadResult:
    updated = await mark_all_read(mongo_user_id)
    return MarkAllReadResult(updated=updated)


@router.post("/{notification_id}/read", response_model=NotificationDto)
async def mark_read_route(
    notification_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> NotificationDto:
    return await mark_read(notification_id, mongo_user_id)
