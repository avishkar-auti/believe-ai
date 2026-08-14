import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Bookmarks a job for a user. Stores a snapshot of the job's display fields
 * rather than just a reference, because external (jsearch) listings are
 * never persisted elsewhere — without a snapshot, a saved external job
 * would vanish the moment it fell off a live search result page.
 */
const savedJobSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    jobId: { type: String, required: true },
    snapshot: {
      source: { type: String, enum: ["internal", "jsearch"], required: true },
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String, default: null },
      description: { type: String, default: "" },
      skills: { type: [String], default: [] },
      employmentType: { type: String, default: null },
      workMode: { type: String, default: null },
      experienceLevel: { type: String, default: null },
      salaryMin: { type: Number, default: null },
      salaryMax: { type: Number, default: null },
      recruiterLinkedIn: { type: String, default: null },
      applyUrl: { type: String, default: null },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export type SavedJobDocument = InferSchemaType<typeof savedJobSchema>;
export const SavedJobModel = model("SavedJob", savedJobSchema);
