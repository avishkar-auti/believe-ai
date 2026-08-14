import { Schema, model, type InferSchemaType } from "mongoose";

/** userId is optional — feedback can be submitted while signed out. */
const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    message: { type: String, required: true },
    page: { type: String, default: null },
    status: { type: String, enum: ["new", "reviewed", "resolved"], default: "new" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type FeedbackDocument = InferSchemaType<typeof feedbackSchema>;
export const FeedbackModel = model("Feedback", feedbackSchema);
