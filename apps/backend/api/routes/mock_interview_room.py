"""Mirrors apps/api's mockInterviewRoom.routes.ts route shapes exactly.
Static paths (/mine, /ice-servers) are declared before the /{code} and
/{room_id} dynamic routes below, same ordering requirement Express has."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserNameDep
from schemas.mock_interview_room import IceServersResult, MockInterviewRoomDto, RoomRecapDto, RoomSummaryDto, ScheduleRoomInput
from services import mock_interview_room_service

router = APIRouter(prefix="/mock-interview", tags=["mock-interview-room"])


@router.get("/mine", response_model=list[MockInterviewRoomDto])
async def list_mine_route(mongo_user_id: MongoUserIdDep) -> list[MockInterviewRoomDto]:
    return await mock_interview_room_service.list_mine(mongo_user_id)


@router.get("/ice-servers", response_model=IceServersResult)
async def ice_servers_route(settings: SettingsDep) -> IceServersResult:
    return IceServersResult(iceServers=mock_interview_room_service.get_ice_servers(settings))


@router.post("/", response_model=MockInterviewRoomDto, status_code=201)
async def schedule_route(body: ScheduleRoomInput, mongo_user_id: MongoUserIdDep, user_name: UserNameDep) -> MockInterviewRoomDto:
    return await mock_interview_room_service.schedule(mongo_user_id, user_name, body)


@router.get("/{code}", response_model=MockInterviewRoomDto)
async def get_by_code_route(code: str, _mongo_user_id: MongoUserIdDep) -> MockInterviewRoomDto:
    return await mock_interview_room_service.get_by_code(code)


@router.get("/{code}/recap", response_model=RoomRecapDto)
async def get_recap_route(code: str, settings: SettingsDep, db: DbDep, _mongo_user_id: MongoUserIdDep) -> RoomRecapDto:
    recap = await mock_interview_room_service.get_recap(settings, db, code)
    return RoomRecapDto(text=recap.text, updatedAt=recap.updatedAt)


@router.get("/{code}/summary", response_model=RoomSummaryDto | None)
async def get_summary_route(code: str, _mongo_user_id: MongoUserIdDep) -> RoomSummaryDto | None:
    return await mock_interview_room_service.get_summary(code)


@router.post("/{code}/end")
async def end_route(code: str, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await mock_interview_room_service.end_room(code, mongo_user_id)
    return {"ended": True}


@router.delete("/{room_id}")
async def cancel_route(room_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, bool]:
    await mock_interview_room_service.cancel(room_id, mongo_user_id)
    return {"cancelled": True}


@router.post("/{room_id}/questions/generate", response_model=MockInterviewRoomDto)
async def regenerate_questions_route(
    room_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, settings: SettingsDep, db: DbDep
) -> MockInterviewRoomDto:
    return await mock_interview_room_service.regenerate_questions(settings, db, room_id, mongo_user_id)
