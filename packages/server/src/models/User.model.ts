import { Schema, model, type InferSchemaType } from "mongoose";
import { DEFAULT_PLAN_TIER, PLAN_TIERS } from "@believe-ai/shared";

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    name: { type: String, default: "" },
    avatar: { type: String, default: null },
    company: { type: String, default: null },
    jobTitle: { type: String, default: null },
    timezone: { type: String, default: "UTC" },
    role: { type: String, enum: ["user", "admin", "recruiter"], default: "user" },
    plan: { type: String, enum: PLAN_TIERS, default: DEFAULT_PLAN_TIER },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
