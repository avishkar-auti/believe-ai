import { FeedbackModel } from "@believe-ai/server";

export const feedbackRepository = {
  create(userId: string | null, message: string, page: string | null) {
    return FeedbackModel.create({ userId, message, page });
  },
};
