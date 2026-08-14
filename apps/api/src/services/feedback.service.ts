import type { HydratedDocument } from "mongoose";
import type { CreateFeedbackInput, Feedback } from "@believe-ai/shared";
import type { FeedbackDocument } from "@believe-ai/server";
import { feedbackRepository } from "../repositories/feedback.repository.js";

function toDto(doc: HydratedDocument<FeedbackDocument>): Feedback {
  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString() ?? null,
    message: doc.message,
    page: doc.page ?? null,
    status: doc.status as Feedback["status"],
    createdAt: doc.createdAt.toISOString(),
  };
}

export const feedbackService = {
  async submit(userId: string | null, input: CreateFeedbackInput): Promise<Feedback> {
    const doc = await feedbackRepository.create(userId, input.message, input.page ?? null);
    return toDto(doc);
  },
};
