import type {
  MockInterviewRoom,
  RoomFeedback,
  RoomFeedbackSummaryEntry,
  RoomIdea,
  RoomLiveRecap,
  ScheduleRoomInput,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export async function scheduleRoom(input: ScheduleRoomInput) {
  const res = await apiClient.post<MockInterviewRoom>("/mock-interview", input);
  return res.data;
}

export async function fetchMyRooms() {
  const res = await apiClient.get<MockInterviewRoom[]>("/mock-interview/mine");
  return res.data;
}

export async function fetchRoomByCode(code: string) {
  const res = await apiClient.get<MockInterviewRoom>(`/mock-interview/${code}`);
  return res.data;
}

export async function cancelRoom(id: string) {
  await apiClient.delete(`/mock-interview/${id}`);
}

export async function endRoom(code: string) {
  await apiClient.post(`/mock-interview/${code}/end`);
}

export async function fetchRoomSummary(code: string) {
  const res = await apiClient.get<MockInterviewRoom["summary"]>(`/mock-interview/${code}/summary`);
  return res.data;
}

export async function regenerateRoomQuestions(id: string) {
  const res = await apiClient.post<MockInterviewRoom>(`/mock-interview/${id}/questions/generate`);
  return res.data;
}

export async function fetchIdeas(code: string) {
  const res = await apiClient.get<RoomIdea[]>(`/mock-interview/${code}/ideas`);
  return res.data;
}

export async function postIdea(code: string, questionId: string, text: string) {
  const res = await apiClient.post<RoomIdea>(`/mock-interview/${code}/ideas`, { questionId, text });
  return res.data;
}

export async function submitRoomFeedback(
  code: string,
  input: { questionId: string; turnSpeakerUserId: string; rating: number; comment: string | null },
) {
  const res = await apiClient.post<RoomFeedback>(`/mock-interview/${code}/feedback`, input);
  return res.data;
}

export async function fetchRoomFeedbackSummary(code: string) {
  const res = await apiClient.get<RoomFeedbackSummaryEntry[]>(`/mock-interview/${code}/feedback/summary`);
  return res.data;
}

export async function postTranscriptChunk(
  code: string,
  input: { questionId: string | null; text: string },
) {
  await apiClient.post(`/mock-interview/${code}/transcript`, input);
}

export async function fetchRoomRecap(code: string) {
  const res = await apiClient.get<RoomLiveRecap>(`/mock-interview/${code}/recap`);
  return res.data;
}

export async function fetchIceServers() {
  const res = await apiClient.get<{ iceServers: IceServer[] }>("/mock-interview/ice-servers");
  return res.data.iceServers;
}

/** Derives the signaling WebSocket origin from the backend's base URL
 * (ws/mock_interview.py) — same host/port, ws(s):// protocol, root path. */
export function getSignalingWsUrl(): string {
  const apiBase = new URL(import.meta.env.VITE_API_BASE_URL as string);
  const wsProtocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${apiBase.host}/ws/mock-interview`;
}
