import { UnsubscribeRecordModel } from "@believe-ai/server";

export const unsubscribeRepository = {
  isUnsubscribed(userId: string, email: string) {
    return UnsubscribeRecordModel.exists({ userId, email: email.toLowerCase() });
  },

  async findUnsubscribedEmails(userId: string, emails: string[]): Promise<Set<string>> {
    const records = await UnsubscribeRecordModel.find({
      userId,
      email: { $in: emails.map((e) => e.toLowerCase()) },
    })
      .select("email")
      .lean();
    return new Set(records.map((r) => r.email));
  },

  add(userId: string, email: string, reason: string | null) {
    return UnsubscribeRecordModel.findOneAndUpdate(
      { userId, email: email.toLowerCase() },
      { $setOnInsert: { reason } },
      { upsert: true, new: true },
    );
  },
};
