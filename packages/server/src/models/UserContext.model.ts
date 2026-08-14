import { Schema, model, type InferSchemaType } from "mongoose";

const userContextSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", unique: true, index: true },
    aboutMe: { type: String, default: null },
    companyInfo: { type: String, default: null },
    servicesOrProducts: { type: String, default: null },
    skillsAndExperience: { type: String, default: null },
    achievements: { type: String, default: null },
    targetAudience: { type: String, default: null },
  },
  { timestamps: true },
);

export type UserContextDocument = InferSchemaType<typeof userContextSchema>;
export const UserContextModel = model("UserContext", userContextSchema);
