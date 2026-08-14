import { Schema, model, type InferSchemaType } from "mongoose";

const integrationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    provider: { type: String, enum: ["gmail", "outlook"], required: true },
    email: { type: String, required: true },
    /** AES-256-GCM encrypted refresh token — never store OAuth secrets in plaintext. */
    encryptedRefreshToken: { type: String, required: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

integrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export type IntegrationDocument = InferSchemaType<typeof integrationSchema>;
export const IntegrationModel = model("Integration", integrationSchema);
