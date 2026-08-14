import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One document per generation — unlike Resume, history is kept so a user can
 * track how their assessment changes over time (e.g. after updating their resume).
 */
const careerFitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    targetRole: { type: String, default: null },
    summary: { type: String, required: true },
    strengths: { type: [String], default: [] },
    skillGaps: { type: [String], default: [] },
    suggestedRoles: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

careerFitSchema.index({ userId: 1, createdAt: -1 });

export type CareerFitDocument = InferSchemaType<typeof careerFitSchema>;
export const CareerFitModel = model("CareerFit", careerFitSchema);
