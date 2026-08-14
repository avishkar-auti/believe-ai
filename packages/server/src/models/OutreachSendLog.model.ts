import { Schema, model, type InferSchemaType } from "mongoose";

/** One row per send attempt (or per permanent LinkedIn "drafted" record) for
 * an approved OutreachDraft. See outreachSend.ts (shared types) for the two
 * ethical guarantees this exists to enforce. */
const outreachSendLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    outreachDraftId: { type: Schema.Types.ObjectId, required: true, ref: "OutreachDraft", index: true },
    contactId: { type: Schema.Types.ObjectId, required: true, ref: "Contact" },
    channel: { type: String, enum: ["email", "linkedin"], required: true },
    status: { type: String, enum: ["sent", "drafted", "failed", "suppressed"], required: true },
    contentType: { type: String, enum: ["cold_email", "linkedin_note", "follow_up"], default: null },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    providerMessageId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

outreachSendLogSchema.index({ outreachDraftId: 1, createdAt: -1 });

export type OutreachSendLogDocument = InferSchemaType<typeof outreachSendLogSchema>;
export const OutreachSendLogModel = model("OutreachSendLog", outreachSendLogSchema);
