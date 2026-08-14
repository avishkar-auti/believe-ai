import { Schema, model, type InferSchemaType } from "mongoose";

const companyIntelSchema = new Schema(
  {
    employeeCount: { type: Number, default: null },
    techStack: { type: [String], default: [] },
    funding: { type: String, default: null },
    hiringTrend: { type: String, enum: ["growing", "stable", "contracting"], default: null },
    confidence: {
      employeeCount: { type: String, enum: ["high", "low"], default: "low" },
      techStack: { type: String, enum: ["high", "low"], default: "low" },
      funding: { type: String, enum: ["high", "low"], default: "low" },
      hiringTrend: { type: String, enum: ["high", "low"], default: "low" },
    },
  },
  { _id: false },
);

/** One document per analyzed job posting — the first stage of the Job Outreach pipeline. */
const jobIntelSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    jobUrl: { type: String, required: true },
    company: { type: String, required: true },
    roleTitle: { type: String, required: true },
    skills: { type: [String], default: [] },
    experienceLevel: { type: String, default: "Not specified" },
    location: { type: String, default: "Not specified" },
    hiringTeamNames: { type: [String], default: [] },
    atsKeywords: { type: [String], default: [] },
    companyIntel: { type: companyIntelSchema, required: true },
    parsingConfidence: { type: String, enum: ["high", "low"], default: "low" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

jobIntelSchema.index({ userId: 1, createdAt: -1 });

export type JobIntelDocument = InferSchemaType<typeof jobIntelSchema>;
export const JobIntelModel = model("JobIntel", jobIntelSchema);
