import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { isRoomJoinable } from "@believe-ai/shared";
import { firebaseAuth } from "../config/firebase.js";
import { mockInterviewRoomRepository } from "../repositories/mockInterviewRoom.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { logger } from "../config/logger.js";

const WS_PATH = "/ws/mock-interview";

type Role = "host" | "guest";

interface RoomState {
  hostUserId: string;
  sockets: Map<string, WebSocket>;
}

// In-memory only — a room's live signaling state assumes a single server
// process, same documented limitation as the reference this was modeled on.
// Horizontal scaling would need a shared pub/sub (e.g. Redis) between instances.
const rooms = new Map<string, RoomState>();

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function closeWithError(ws: WebSocket, message: string): void {
  send(ws, { type: "error", message });
  ws.close();
}

function otherParticipant(state: RoomState, userId: string): WebSocket | undefined {
  for (const [id, socket] of state.sockets) {
    if (id !== userId) return socket;
  }
  return undefined;
}

/** Notifies both participants once two are present — the host is always the fixed
 * offer-initiator, never whoever happens to connect first (avoids the exact race
 * that made connection-order-based initiator selection flaky under reconnects). */
function announceReadyIfComplete(state: RoomState, code: string): void {
  if (state.sockets.size !== 2) return;
  for (const [userId, socket] of state.sockets) {
    send(socket, { type: "ready", initiator: userId === state.hostUserId });
  }
  logger.info({ code }, "mock-interview room ready — both participants connected");
}

function removeParticipant(code: string, userId: string): void {
  const state = rooms.get(code);
  if (!state) return;
  const socket = state.sockets.get(userId);
  state.sockets.delete(userId);

  const remaining = otherParticipant(state, userId) ?? [...state.sockets.values()][0];
  if (remaining) send(remaining, { type: "peer-left" });

  if (state.sockets.size === 0) rooms.delete(code);
  if (socket && socket.readyState === WebSocket.OPEN) socket.close();
}

export function attachMockInterviewWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on("connection", (ws: WebSocket, request) => {
    void handleConnection(ws, request.url ?? "");
  });

  logger.info(`WebRTC signaling server attached at ${WS_PATH}`);
}

async function handleConnection(ws: WebSocket, rawUrl: string): Promise<void> {
  const url = new URL(rawUrl, "http://internal");
  const token = url.searchParams.get("token");
  const code = url.searchParams.get("code");

  if (!token || !code) return closeWithError(ws, "Missing token or room code");

  let firebaseUid: string;
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    firebaseUid = decoded.uid;
  } catch {
    return closeWithError(ws, "Invalid or expired token");
  }

  const user = await userRepository.findByFirebaseUid(firebaseUid);
  if (!user) return closeWithError(ws, "No believe.ai account found for this token");
  const userId = user._id.toString();

  const room = await mockInterviewRoomRepository.findByCode(code);
  if (!room) return closeWithError(ws, "Room not found");
  if (room.status !== "scheduled") return closeWithError(ws, "This room is no longer active");
  if (!isRoomJoinable(room.scheduledAt.toISOString(), room.durationMinutes)) {
    return closeWithError(ws, "This room isn't open yet — join within 10 minutes of the scheduled start");
  }

  const role: Role = userId === room.hostUserId.toString() ? "host" : "guest";

  let state = rooms.get(code);
  if (!state) {
    state = { hostUserId: room.hostUserId.toString(), sockets: new Map() };
    rooms.set(code, state);
  }

  const existingSocket = state.sockets.get(userId);
  if (existingSocket) {
    // Reconnect (e.g. page refresh) — replace the stale socket rather than
    // rejecting, so a dropped connection doesn't permanently lock someone out.
    existingSocket.close();
    state.sockets.delete(userId);
  } else if (state.sockets.size >= 2) {
    return closeWithError(ws, "This room already has two participants");
  }

  state.sockets.set(userId, ws);
  send(ws, { type: "waiting", role });
  announceReadyIfComplete(state, code);

  ws.on("message", (raw) => {
    let msg: { type?: string } & Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type !== "offer" && msg.type !== "answer" && msg.type !== "ice-candidate") return;

    const current = rooms.get(code);
    if (!current) return;
    const peer = otherParticipant(current, userId);
    if (peer) send(peer, msg);
  });

  ws.on("close", () => removeParticipant(code, userId));
  ws.on("error", (err) => logger.warn({ err, code, userId }, "mock-interview socket error"));
}
