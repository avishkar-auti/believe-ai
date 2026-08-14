import { Schema, model, type InferSchemaType } from "mongoose";

const discussionReplySchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    authorName: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const discussionSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    authorName: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    replies: { type: [discussionReplySchema], default: [] },
    // Who upvoted, not just a count — makes "toggle" and "did I already upvote" trivial.
    upvotes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true },
);

discussionSchema.index({ createdAt: -1 });

export type DiscussionDocument = InferSchemaType<typeof discussionSchema>;
export const DiscussionModel = model("Discussion", discussionSchema);
