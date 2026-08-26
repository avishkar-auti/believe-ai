/**
 * Canonical MockInterviewRoom type — a scheduled group WebRTC peer-practice
 * room (3-6 participants). Join eligibility is always computed from
 * scheduledAt + durationMinutes at request time (see apps/api's service) —
 * never stored as a TTL/expiresAt field, since a createdAt-relative TTL
 * would delete a room booked more than a day ahead before it ever happens.
 */
export type MockInterviewRoomStatus = "scheduled" | "completed" | "cancelled";

export interface ScheduleRoomInput {
  scheduledAt: string;
  durationMinutes?: number;
  targetSize?: number;
  inviteEmails?: string[];
  topic?: string | null;
  targetRole?: string | null;
}

export interface RoomParticipant {
  userId: string;
  name: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface RoomQuestion {
  id: string;
  text: string;
  source: "manual" | "ai";
  order: number;
}

export interface RoomLiveRecap {
  text: string;
  updatedAt: string;
}

export interface RoomPerStudentNote {
  userId: string;
  name: string;
  strength: string;
  growthArea: string;
  averageRating: number | null;
}

export interface RoomSummary {
  groupSummary: string;
  perStudent: RoomPerStudentNote[];
  generatedAt: string;
}

export interface MockInterviewRoom {
  id: string;
  code: string;
  hostUserId: string;
  hostName: string;
  inviteEmails: string[];
  topic: string | null;
  targetRole: string | null;
  scheduledAt: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  status: MockInterviewRoomStatus;
  participants: RoomParticipant[];
  questions: RoomQuestion[];
  currentQuestionIndex: number;
  currentSpeakerUserId: string | null;
  turnStartedAt: string | null;
  liveRecap: RoomLiveRecap | null;
  summary: RoomSummary | null;
  /** True when the join window is currently open: 10 minutes before scheduledAt to 30 minutes after it ends. */
  joinable: boolean;
  createdAt: string;
}

/** Join window: opens 10 minutes early, closes 30 minutes after the scheduled end — shared by the REST check and the WS gate. */
export function isRoomJoinable(scheduledAt: string, durationMinutes: number, now: Date = new Date()): boolean {
  const start = new Date(scheduledAt).getTime();
  const opensAt = start - 10 * 60 * 1000;
  const closesAt = start + durationMinutes * 60 * 1000 + 30 * 60 * 1000;
  const t = now.getTime();
  return t >= opensAt && t <= closesAt;
}
