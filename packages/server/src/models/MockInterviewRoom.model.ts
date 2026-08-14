import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Deliberately has no TTL/expiresAt index — a createdAt-relative TTL would
 * delete a room booked more than a day ahead before it ever happens. Join
 * eligibility is computed at request time from scheduledAt + durationMinutes
 * (see mockInterviewRoom.service.ts), not stored here.
 */
const mockInterviewRoomSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    hostUserId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    hostName: { type: String, required: true },
    guestEmail: { type: String, default: null },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

mockInterviewRoomSchema.index({ hostUserId: 1, scheduledAt: -1 });

export type MockInterviewRoomDocument = InferSchemaType<typeof mockInterviewRoomSchema>;
export const MockInterviewRoomModel = model("MockInterviewRoom", mockInterviewRoomSchema);
