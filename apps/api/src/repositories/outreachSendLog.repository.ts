import { OutreachSendLogModel } from "@believe-ai/server";
import type { OutreachSendChannel, OutreachSendContentType, OutreachSendStatus } from "@believe-ai/shared";

export interface CreateOutreachSendLogRecord {
  userId: string;
  outreachDraftId: string;
  contactId: string;
  channel: OutreachSendChannel;
  status: OutreachSendStatus;
  contentType: OutreachSendContentType | null;
  sentAt: Date | null;
  errorMessage: string | null;
  providerMessageId?: string | null;
}

export const outreachSendLogRepository = {
  create(data: CreateOutreachSendLogRecord) {
    return OutreachSendLogModel.create(data);
  },

  listByDraft(outreachDraftId: string, userId: string) {
    return OutreachSendLogModel.find({ outreachDraftId, userId }).sort({ createdAt: -1 });
  },
};
