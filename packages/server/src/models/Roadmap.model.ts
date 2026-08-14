import { Schema, model, type InferSchemaType } from "mongoose";

const roadmapResourceSchema = new Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["documentation", "course", "book", "practice", "video", "article"],
      required: true,
    },
    url: { type: String, default: null },
    // Only populated for type: "video", from a real YouTube Data API lookup.
    videoId: { type: String, default: null },
    channelName: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    publishedAt: { type: String, default: null },
    durationSeconds: { type: Number, default: null },
  },
  { _id: false },
);

const roadmapStageSchema = new Schema(
  {
    title: { type: String, required: true },
    topics: { type: [String], default: [] },
    resources: { type: [roadmapResourceSchema], default: [] },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: null },
    prerequisites: { type: [String], default: [] },
    // Set only when the roadmap was generated with a resume on file.
    skillStatus: { type: String, enum: ["strong", "missing", "improve"], default: null },
  },
  { _id: false },
);

/** One document per generation — a user may want roadmaps for several different goals. */
const roadmapSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    goal: { type: String, required: true },
    stages: { type: [roadmapStageSchema], default: [] },
    detectedSkills: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

roadmapSchema.index({ userId: 1, createdAt: -1 });

export type RoadmapDocument = InferSchemaType<typeof roadmapSchema>;
export const RoadmapModel = model("Roadmap", roadmapSchema);
