import type { ApiSuccessResponse, MockInterviewRoom, ScheduleRoomInput } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export async function scheduleRoom(input: ScheduleRoomInput) {
  const res = await apiClient.post<ApiSuccessResponse<MockInterviewRoom>>("/mock-interview", input);
  return res.data.data;
}

export async function fetchMyRooms() {
  const res = await apiClient.get<ApiSuccessResponse<MockInterviewRoom[]>>("/mock-interview/mine");
  return res.data.data;
}

export async function fetchRoomByCode(code: string) {
  const res = await apiClient.get<ApiSuccessResponse<MockInterviewRoom>>(`/mock-interview/${code}`);
  return res.data.data;
}

export async function cancelRoom(id: string) {
  await apiClient.delete(`/mock-interview/${id}`);
}

export async function fetchIceServers() {
  const res = await apiClient.get<ApiSuccessResponse<{ iceServers: IceServer[] }>>("/mock-interview/ice-servers");
  return res.data.data.iceServers;
}

/** Derives the signaling WebSocket origin from the REST API's base URL — same
 * host/port, ws(s):// protocol, root path (the WS server isn't mounted under /api/v1). */
export function getSignalingWsUrl(): string {
  const apiBase = new URL(import.meta.env.VITE_API_BASE_URL as string);
  const wsProtocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${apiBase.host}/ws/mock-interview`;
}
