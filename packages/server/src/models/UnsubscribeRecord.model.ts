import { Schema, model, type InferSchemaType } from "mongoose";

const unsubscribeRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, default: null },
  },
  { timestamps: true },
);

unsubscribeRecordSchema.index({ userId: 1, email: 1 }, { unique: true });

export type UnsubscribeRecordDocument = InferSchemaType<typeof unsubscribeRecordSchema>;
export const UnsubscribeRecordModel = model("UnsubscribeRecord", unsubscribeRecordSchema);
