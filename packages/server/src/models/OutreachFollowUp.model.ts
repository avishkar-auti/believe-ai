import { Schema, model, type InferSchemaType } from "mongoose";

/** Day 3/7/14 follow-up cadence for one contact's approved OutreachDraft —
 * capped at 3 (sequenceNumber 1-3). `cancelled` is set the moment the user
 * marks the contact replied; the worker re-checks this flag immediately
 * before sending, since a reply can arrive during the delay window. */
const outreachFollowUpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    outreachDraftId: { type: Schema.Types.ObjectId, required: true, ref: "OutreachDraft", index: true },
    contactId: { type: Schema.Types.ObjectId, required: true, ref: "Contact" },
    sequenceNumber: { type: Number, required: true, min: 1, max: 3 },
    scheduledFor: { type: Date, required: true },
    sent: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

outreachFollowUpSchema.index({ outreachDraftId: 1, sequenceNumber: 1 });

export type OutreachFollowUpDocument = InferSchemaType<typeof outreachFollowUpSchema>;
export const OutreachFollowUpModel = model("OutreachFollowUp", outreachFollowUpSchema);
