import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Raw resume bytes, kept in their own collection so metadata reads (e.g.
 * listing a user's resume status) never pull a multi-MB binary along with
 * them — Resume.model.ts holds everything else.
 */
const resumeFileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true, unique: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export type ResumeFileDocument = InferSchemaType<typeof resumeFileSchema>;
export const ResumeFileModel = model("ResumeFile", resumeFileSchema);
