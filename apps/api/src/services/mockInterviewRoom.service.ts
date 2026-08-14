import { randomBytes } from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { isRoomJoinable, type MockInterviewRoom, type ScheduleRoomInput } from "@believe-ai/shared";
import type { MockInterviewRoomDocument } from "@believe-ai/server";
import { mockInterviewRoomRepository } from "../repositories/mockInterviewRoom.repository.js";
import { meetingEmailQueue } from "../queues/meetingEmailQueue.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { env } from "../config/env.js";

const REMINDER_LEAD_MINUTES = 10;

function toDto(doc: HydratedDocument<MockInterviewRoomDocument>): MockInterviewRoom {
  const scheduledAt = doc.scheduledAt.toISOString();
  return {
    id: doc._id.toString(),
    code: doc.code,
    hostUserId: doc.hostUserId.toString(),
    hostName: doc.hostName,
    guestEmail: doc.guestEmail ?? null,
    scheduledAt,
    durationMinutes: doc.durationMinutes,
    status: doc.status as MockInterviewRoom["status"],
    joinable: doc.status === "scheduled" && isRoomJoinable(scheduledAt, doc.durationMinutes),
    createdAt: doc.createdAt.toISOString(),
  };
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomBytes(4).toString("hex");
    const existing = await mockInterviewRoomRepository.findByCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code — try again");
}

export const mockInterviewRoomService = {
  toDto,

  async schedule(hostUserId: string, hostName: string, input: ScheduleRoomInput): Promise<MockInterviewRoom> {
    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new ValidationError("scheduledAt must be in the future");
    }

    const code = await generateUniqueCode();
    const doc = await mockInterviewRoomRepository.create({
      code,
      hostUserId,
      hostName,
      guestEmail: input.guestEmail ?? null,
      scheduledAt,
      durationMinutes: input.durationMinutes,
    });

    if (doc.guestEmail) {
      const base = {
        roomId: doc._id.toString(),
        hostUserId,
        hostName,
        guestEmail: doc.guestEmail,
        roomCode: doc.code,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: doc.durationMinutes,
      };
      await meetingEmailQueue.add("invite", { ...base, kind: "invite" });

      const reminderAt = scheduledAt.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000;
      const delay = reminderAt - Date.now();
      // Only queue the reminder if it would actually fire before the meeting starts —
      // a room booked less than 10 minutes out shouldn't get a "starting soon" email after it's over.
      if (delay > 0) {
        await meetingEmailQueue.add("reminder", { ...base, kind: "reminder" }, { delay });
      }
    }

    return toDto(doc);
  },

  async listMine(hostUserId: string): Promise<MockInterviewRoom[]> {
    const docs = await mockInterviewRoomRepository.listByHost(hostUserId);
    return docs.map(toDto);
  },

  async getByCode(code: string): Promise<MockInterviewRoom> {
    const doc = await mockInterviewRoomRepository.findByCode(code);
    if (!doc) throw new NotFoundError("Room not found");
    return toDto(doc);
  },

  async cancel(id: string, hostUserId: string): Promise<void> {
    const doc = await mockInterviewRoomRepository.cancel(id, hostUserId);
    if (!doc) throw new NotFoundError("Room not found");
  },

  /**
   * Served per-session rather than bundled into the client — TURN
   * credentials are a real secret, not something to ship in a JS bundle.
   * A public STUN server is always included so calls work without any
   * config; TURN is added only when configured, for networks that block
   * direct peer-to-peer connections.
   */
  getIceServers(): { urls: string | string[]; username?: string; credential?: string }[] {
    const servers: { urls: string | string[]; username?: string; credential?: string }[] = [
      { urls: "stun:stun.l.google.com:19302" },
    ];
    if (env.TURN_URLS && env.TURN_USERNAME && env.TURN_CREDENTIAL) {
      servers.push({
        urls: env.TURN_URLS.split(",").map((u) => u.trim()),
        username: env.TURN_USERNAME,
        credential: env.TURN_CREDENTIAL,
      });
    }
    return servers;
  },
};
