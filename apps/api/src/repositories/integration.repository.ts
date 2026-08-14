import { IntegrationModel } from "@believe-ai/server";

export const integrationRepository = {
  list(userId: string) {
    return IntegrationModel.find({ userId });
  },

  findByProvider(userId: string, provider: "gmail" | "outlook") {
    return IntegrationModel.findOne({ userId, provider });
  },

  upsert(userId: string, provider: "gmail" | "outlook", email: string, encryptedRefreshToken: string) {
    return IntegrationModel.findOneAndUpdate(
      { userId, provider },
      { email, encryptedRefreshToken, connectedAt: new Date() },
      { upsert: true, new: true },
    );
  },

  delete(userId: string, provider: "gmail" | "outlook") {
    return IntegrationModel.findOneAndDelete({ userId, provider });
  },
};
