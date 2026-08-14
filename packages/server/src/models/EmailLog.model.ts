import { Schema, model, type InferSchemaType } from "mongoose";
import { EMAIL_LOG_STATUSES } from "@believe-ai/shared";

const emailLogSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, required: true, ref: "Campaign", index: true },
    contactId: { type: Schema.Types.ObjectId, required: true, ref: "Contact", index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    stepIndex: { type: Number, default: 0 },
    status: { type: String, enum: EMAIL_LOG_STATUSES, default: "QUEUED", index: true },
    providerMessageId: { type: String, default: null },
    trackingToken: { type: String, required: true, unique: true, index: true },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    replied: { type: Boolean, default: false },
    errorMessage: { type: String, default: null },
    sentAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

emailLogSchema.index({ campaignId: 1, status: 1 });
emailLogSchema.index({ campaignId: 1, contactId: 1, stepIndex: 1 }, { unique: true });

export type EmailLogDocument = InferSchemaType<typeof emailLogSchema>;
export const EmailLogModel = model("EmailLog", emailLogSchema);
