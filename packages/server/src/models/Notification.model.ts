import { Schema, model, type InferSchemaType } from "mongoose";
import { NOTIFICATION_TYPES } from "@believe-ai/shared";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);
