import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One resume per user — re-uploading replaces this document wholesale so
 * stale chunks/vectors from a previous resume can never survive alongside
 * new ones.
 */
const resumeChunkSchema = new Schema(
  {
    text: { type: String, required: true },
    // Null until the Python AI service's embedding step has run for this chunk.
    vector: { type: [Number], default: null },
  },
  { _id: false },
);

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true, unique: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    content: { type: String, required: true },
    chunks: { type: [resumeChunkSchema], default: [] },
  },
  { timestamps: true },
);

export type ResumeDocument = InferSchemaType<typeof resumeSchema>;
export const ResumeModel = model("Resume", resumeSchema);
