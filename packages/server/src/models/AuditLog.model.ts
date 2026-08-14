import { Schema, model, type InferSchemaType } from "mongoose";
import { AUDIT_ACTIONS } from "@believe-ai/shared";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: null },
    /**
     * Non-sensitive descriptors only (names, counts). Never credentials,
     * OAuth tokens, or email content — spec 29's "do not log" list.
     */
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ userId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model("AuditLog", auditLogSchema);
