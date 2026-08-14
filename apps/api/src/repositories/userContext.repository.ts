import { UserContextModel } from "@believe-ai/server";
import type { UpdateUserContextInput } from "@believe-ai/shared";

export const userContextRepository = {
  findByUserId(userId: string) {
    return UserContextModel.findOne({ userId });
  },

  upsert(userId: string, updates: UpdateUserContextInput) {
    return UserContextModel.findOneAndUpdate({ userId }, { $set: updates }, { upsert: true, new: true });
  },
};
