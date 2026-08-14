import { Schema, model, type InferSchemaType } from "mongoose";
import { CAMPAIGN_STATUSES } from "@believe-ai/shared";

const campaignFollowUpSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, required: true, ref: "Template" },
    delayDays: { type: Number, required: true },
    subjectOverride: { type: String, default: null },
  },
  { _id: false },
);

const campaignSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    templateId: { type: Schema.Types.ObjectId, required: true, ref: "Template" },
    audienceContactIds: { type: [Schema.Types.ObjectId], ref: "Contact", default: [] },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "DRAFT", index: true },
    scheduledAt: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    dailyLimit: { type: Number, default: 200 },
    personalizationEnabled: { type: Boolean, default: true },
    trackingEnabled: { type: Boolean, default: true },
    followUps: { type: [campaignFollowUpSchema], default: [] },
    stopOnReply: { type: Boolean, default: true },
  },
  { timestamps: true },
);

campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });

export type CampaignDocument = InferSchemaType<typeof campaignSchema>;
export const CampaignModel = model("Campaign", campaignSchema);
