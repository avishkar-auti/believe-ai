"""WebRTC signaling for the Group Practice Room — mirrors apps/api's
ws/mockInterview.ws.ts protocol exactly (same message shapes, same
in-memory single-process room-state limitation). The frontend's WebRTC
client is unchanged by this port; only the server implementation moved.

In-memory only — a room's live signaling state assumes a single server
process, same documented limitation as the Node version. Horizontal
scaling would need a shared pub/sub (e.g. Redis) between instances.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from core.logging import get_logger
from core.security import verify_firebase_token
from models.user import User
from repositories import mock_interview_room_repository
from utils.room_joinable import is_room_joinable

logger = get_logger(__name__)
router = APIRouter()


@dataclass
class _RoomQuestionRef:
    id: str
    text: str


@dataclass
class _Socket:
    ws: WebSocket
    name: str


@dataclass
class _RoomState:
    hostUserId: str
    minParticipants: int
    maxParticipants: int
    questions: list[_RoomQuestionRef]
    currentQuestionIndex: int
    currentSpeakerUserId: str | None
    turnStartedAt: str | None
    # Set once the room has broadcast "room-active" so it doesn't re-fire on every reconnect.
    activeAnnounced: bool
    sockets: dict[str, _Socket] = field(default_factory=dict)


# Same single-process limitation as the Node version.
_rooms: dict[str, _RoomState] = {}


async def _send(ws: WebSocket, payload: dict[str, Any]) -> None:
    if ws.application_state == WebSocketState.CONNECTED:
        await ws.send_text(json.dumps(payload))


async def _safe_close(ws: WebSocket) -> None:
    """Closing a socket the client already disconnected can raise
    RuntimeError at the ASGI layer even though `application_state` still
    reads CONNECTED (uvicorn completes its side of a client-initiated
    disconnect before the app calls close()) — this is always a no-op
    cleanup attempt, never something the caller should abort over."""
    if ws.application_state != WebSocketState.CONNECTED:
        return
    try:
        await ws.close()
    except RuntimeError:
        pass


async def _broadcast(state: _RoomState, payload: dict[str, Any], except_user_id: str | None = None) -> None:
    for user_id, entry in state.sockets.items():
        if user_id == except_user_id:
            continue
        await _send(entry.ws, payload)


async def _close_with_error(ws: WebSocket, message: str) -> None:
    await _send(ws, {"type": "error", "message": message})
    await _safe_close(ws)


def _next_speaker(state: _RoomState) -> str | None:
    ids = list(state.sockets.keys())
    if not ids:
        return None
    if not state.currentSpeakerUserId:
        return ids[0]
    idx = ids.index(state.currentSpeakerUserId) if state.currentSpeakerUserId in ids else -1
    return ids[(idx + 1) % len(ids)]


async def _persist_turn_state(code: str, state: _RoomState) -> None:
    try:
        await mock_interview_room_repository.update_turn_state(
            code,
            current_question_index=state.currentQuestionIndex,
            current_speaker_user_id=ObjectId(state.currentSpeakerUserId) if state.currentSpeakerUserId else None,
            turn_started_at=datetime.fromisoformat(state.turnStartedAt) if state.turnStartedAt else None,
        )
    except Exception as err:  # noqa: BLE001 — best-effort persistence, the WS state is the source of truth
        logger.warning("failed to persist room turn state for %s: %s", code, err)


async def _advance_turn(code: str, state: _RoomState) -> None:
    if not state.questions:
        return

    state.currentQuestionIndex = (state.currentQuestionIndex + 1) % len(state.questions)
    state.currentSpeakerUserId = _next_speaker(state)
    state.turnStartedAt = datetime.now(UTC).isoformat()

    question = state.questions[state.currentQuestionIndex]
    await _broadcast(
        state,
        {
            "type": "turn-changed",
            "questionId": question.id,
            "questionText": question.text,
            "questionIndex": state.currentQuestionIndex,
            "speakerUserId": state.currentSpeakerUserId,
            "turnStartedAt": state.turnStartedAt,
        },
    )

    asyncio.create_task(_persist_turn_state(code, state))  # noqa: RUF006 — fire-and-forget, matches Node's .catch()


async def _persist_participant_left(code: str, user_id: str) -> None:
    try:
        await mock_interview_room_repository.mark_participant_left(code, ObjectId(user_id))
    except Exception as err:  # noqa: BLE001 — best-effort persistence
        logger.warning("failed to persist participant leave for %s/%s: %s", code, user_id, err)


async def _remove_participant(code: str, user_id: str) -> None:
    # Scheduled first and unconditionally — everything below (broadcast, the
    # room-state cleanup, closing the socket) is best-effort and must never
    # be able to skip persisting that this participant left.
    asyncio.create_task(_persist_participant_left(code, user_id))  # noqa: RUF006

    state = _rooms.get(code)
    if not state:
        return
    socket = state.sockets.pop(user_id, None)

    await _broadcast(state, {"type": "peer-left", "userId": user_id})

    if not state.sockets:
        _rooms.pop(code, None)
    if socket:
        await _safe_close(socket.ws)


async def broadcast_to_room(code: str, payload: dict[str, Any]) -> None:
    """Lets other backend code (e.g. a future idea-board endpoint) push a live
    update to everyone in a room without duplicating the socket registry."""
    state = _rooms.get(code)
    if not state:
        return
    await _broadcast(state, payload)


async def _persist_participant_join(code: str, user_id: str, name: str, joined_at: datetime) -> None:
    try:
        await mock_interview_room_repository.add_participant(code, ObjectId(user_id), name, joined_at)
    except Exception as err:  # noqa: BLE001 — best-effort persistence
        logger.warning("failed to persist participant join for %s/%s: %s", code, user_id, err)


@router.websocket("/ws/mock-interview")
async def mock_interview_ws(websocket: WebSocket) -> None:
    await websocket.accept()

    token = websocket.query_params.get("token")
    code = websocket.query_params.get("code")
    if not token or not code:
        await _close_with_error(websocket, "Missing token or room code")
        return

    try:
        firebase_uid = await verify_firebase_token(token)
    except Exception:  # noqa: BLE001 — any verification failure is unauthenticated
        await _close_with_error(websocket, "Invalid or expired token")
        return

    user = await User.find_one(User.firebaseUid == firebase_uid)
    if not user or not user.id:
        await _close_with_error(websocket, "No believe.ai account found for this token")
        return
    user_id = str(user.id)
    name = user.name or user.email

    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        await _close_with_error(websocket, "Room not found")
        return
    if room.status != "scheduled":
        await _close_with_error(websocket, "This room is no longer active")
        return
    if not is_room_joinable(room.scheduledAt, room.durationMinutes):
        await _close_with_error(websocket, "This room isn't open yet — join within 10 minutes of the scheduled start")
        return

    state = _rooms.get(code)
    if not state:
        state = _RoomState(
            hostUserId=str(room.hostUserId),
            minParticipants=room.minParticipants,
            maxParticipants=room.maxParticipants,
            questions=[_RoomQuestionRef(id=q.id, text=q.text) for q in room.questions],
            currentQuestionIndex=room.currentQuestionIndex,
            currentSpeakerUserId=str(room.currentSpeakerUserId) if room.currentSpeakerUserId else None,
            turnStartedAt=room.turnStartedAt.isoformat() if room.turnStartedAt else None,
            activeAnnounced=False,
        )
        _rooms[code] = state

    existing_socket = state.sockets.get(user_id)
    if existing_socket:
        # Reconnect (e.g. page refresh) — replace the stale socket rather than
        # rejecting, so a dropped connection doesn't permanently lock someone out.
        await _safe_close(existing_socket.ws)
        del state.sockets[user_id]
    elif len(state.sockets) >= state.maxParticipants:
        await _close_with_error(websocket, "This room is full")
        return

    # Existing peers learn about the newcomer first, so by the time the newcomer's own
    # "roster" snapshot arrives (and it starts sending offers to everyone already listed
    # there), every existing peer is already expecting it.
    await _broadcast(state, {"type": "peer-joined", "userId": user_id, "name": name})

    state.sockets[user_id] = _Socket(ws=websocket, name=name)

    already_active = len(state.sockets) >= state.minParticipants

    await _send(
        websocket,
        {
            "type": "roster",
            "hostUserId": state.hostUserId,
            "minParticipants": state.minParticipants,
            "maxParticipants": state.maxParticipants,
            "participants": [{"userId": uid, "name": entry.name} for uid, entry in state.sockets.items() if uid != user_id],
            "questions": [{"id": q.id, "text": q.text} for q in state.questions],
            "currentQuestionIndex": state.currentQuestionIndex,
            "currentSpeakerUserId": state.currentSpeakerUserId,
            "turnStartedAt": state.turnStartedAt,
            # Included directly (not just relying on the one-shot "room-active" broadcast
            # below) so a joiner arriving after the room already went active still learns
            # that immediately, instead of waiting forever for a broadcast that already
            # fired for everyone else.
            "active": already_active,
        },
    )

    if not state.activeAnnounced and already_active:
        state.activeAnnounced = True
        await _broadcast(state, {"type": "room-active"}, except_user_id=user_id)

    joined_at = datetime.now(UTC)
    asyncio.create_task(_persist_participant_join(code, user_id, name, joined_at))  # noqa: RUF006

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue

            msg_type = msg.get("type")
            if msg_type in ("offer", "answer", "ice-candidate"):
                to = msg.get("to")
                if not isinstance(to, str):
                    continue
                current = _rooms.get(code)
                target = current.sockets.get(to) if current else None
                if target:
                    await _send(target.ws, {**msg, "from": user_id})
                continue

            if msg_type == "advance-turn":
                current = _rooms.get(code)
                if not current or user_id != current.hostUserId:
                    continue
                await _advance_turn(code, current)
    except WebSocketDisconnect:
        pass
    except Exception as err:  # noqa: BLE001 — mirrors Node's ws.on("error") handler
        logger.warning("mock-interview socket error for %s/%s: %s", code, user_id, err)
    finally:
        await _remove_participant(code, user_id)
