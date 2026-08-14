import { Schema, model, type InferSchemaType } from "mongoose";

const contactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, default: null },
    jobTitle: { type: String, default: null },
    phone: { type: String, default: null },
    tags: { type: [String], default: [] },
    notes: { type: String, default: null },
    source: { type: String, enum: ["manual", "csv_import", "api"], default: "manual" },
    subscribed: { type: Boolean, default: true },
  },
  { timestamps: true },
);

contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ userId: 1, tags: 1 });

export type ContactDocument = InferSchemaType<typeof contactSchema>;
export const ContactModel = model("Contact", contactSchema);
