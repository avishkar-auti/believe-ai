import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A person discovered at a target company for one JobIntel — ported from
 * HireConnect's lead_discovery_agent. `workEmailPattern` is an inferred
 * convention, never verified, so this never becomes a real Contact (used
 * for actual sending) without the user explicitly supplying a real email
 * via the "add to contacts" action (addedContactId tracks that).
 */
const jobLeadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    jobIntelId: { type: Schema.Types.ObjectId, required: true, ref: "JobIntel", index: true },
    name: { type: String, required: true },
    title: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    relevanceRank: { type: Number, default: 99 },
    warmPath: { type: Boolean, default: false },
    warmPathReason: { type: String, default: null },
    workEmailPattern: { type: String, default: null },
    addedContactId: { type: Schema.Types.ObjectId, ref: "Contact", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

jobLeadSchema.index({ jobIntelId: 1, relevanceRank: 1 });

export type JobLeadDocument = InferSchemaType<typeof jobLeadSchema>;
export const JobLeadModel = model("JobLead", jobLeadSchema);
