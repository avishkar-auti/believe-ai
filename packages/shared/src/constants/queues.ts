export const QUEUE_NAMES = {
  EMAIL_SEND: "email.send",
  MEETING_EMAIL: "meeting.email",
  OUTREACH_FOLLOW_UP: "outreach.followup",
  ROOM_SUMMARY: "room.summary",
} as const;

export interface EmailSendJobData {
  emailLogId: string;
  campaignId: string;
  contactId: string;
  userId: string;
  stepIndex: number;
}

export interface MeetingEmailJobData {
  roomId: string;
  hostUserId: string;
  hostName: string;
  guestEmail: string;
  roomCode: string;
  scheduledAt: string;
  durationMinutes: number;
  kind: "invite" | "reminder";
}

export interface OutreachFollowUpJobData {
  followUpId: string;
  outreachDraftId: string;
  contactId: string;
  userId: string;
  sequenceNumber: number;
}

export interface RoomSummaryJobData {
  roomId: string;
}
