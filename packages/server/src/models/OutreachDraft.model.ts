import { Schema, model, type InferSchemaType } from "mongoose";

const editedTextSchema = new Schema(
  {
    coldEmail: { type: String, default: null },
    linkedinNote: { type: String, default: null },
    referralRequest: { type: String, default: null },
    coverLetter: { type: String, default: null },
  },
  { _id: false },
);

/** AI-drafted outreach for one contact, grounded in a job analysis (JobIntel).
 * Every draft starts "pending" and must be explicitly approved/edited/rejected
 * before Phase 4's send step will ever touch it. */
const outreachDraftSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    jobIntelId: { type: Schema.Types.ObjectId, required: true, ref: "JobIntel", index: true },
    contactId: { type: Schema.Types.ObjectId, required: true, ref: "Contact" },
    contactName: { type: String, required: true },
    hook: { type: String, required: true },
    hookConfidence: { type: String, enum: ["high", "low"], required: true },
    coldEmail: { type: String, required: true },
    linkedinNote: { type: String, required: true },
    referralRequest: { type: String, default: null },
    coverLetter: { type: String, default: null },
    status: { type: String, enum: ["pending", "approved", "edited", "rejected"], default: "pending" },
    editedText: { type: editedTextSchema, default: null },
  },
  { timestamps: true },
);

outreachDraftSchema.index({ jobIntelId: 1, createdAt: -1 });

export type OutreachDraftDocument = InferSchemaType<typeof outreachDraftSchema>;
export const OutreachDraftModel = model("OutreachDraft", outreachDraftSchema);
