import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Only recruiter-posted listings live here — external (JSearch) results are
 * fetched live and merged into the list response, never persisted.
 */
const jobSchema = new Schema(
  {
    postedBy: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: null },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship"],
      default: null,
    },
    workMode: { type: String, enum: ["remote", "hybrid", "onsite"], default: null },
    experienceLevel: { type: String, enum: ["fresher", "junior", "mid", "senior", "lead"], default: null },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    recruiterLinkedIn: { type: String, default: null },
    applyUrl: { type: String, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ createdAt: -1 });
jobSchema.index({ salaryMax: 1 });

export type JobDocument = InferSchemaType<typeof jobSchema>;
export const JobModel = model("Job", jobSchema);
