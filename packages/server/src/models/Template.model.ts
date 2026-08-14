import { Schema, model, type InferSchemaType } from "mongoose";

const templateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

templateSchema.index({ userId: 1, createdAt: -1 });

export type TemplateDocument = InferSchemaType<typeof templateSchema>;
export const TemplateModel = model("Template", templateSchema);
