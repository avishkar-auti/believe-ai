from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserIdDep
from schemas.audit import AuditLogDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services.audit_service import list_audit_logs

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("/", response_model=PaginatedResult[AuditLogDto])
async def list_audit_logs_route(
    mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[AuditLogDto]:
    return await list_audit_logs(mongo_user_id, page, limit)
