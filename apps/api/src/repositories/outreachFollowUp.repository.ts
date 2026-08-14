import { OutreachFollowUpModel } from "@believe-ai/server";
import { MAX_FOLLOW_UPS } from "@believe-ai/shared";

export interface CreateOutreachFollowUpRecord {
  userId: string;
  outreachDraftId: string;
  contactId: string;
  sequenceNumber: number;
  scheduledFor: Date;
}

export const outreachFollowUpRepository = {
  async create(data: CreateOutreachFollowUpRecord) {
    if (data.sequenceNumber > MAX_FOLLOW_UPS) {
      throw new Error(`Refusing to schedule follow-up #${data.sequenceNumber} — cap is ${MAX_FOLLOW_UPS}`);
    }
    return OutreachFollowUpModel.create(data);
  },

  listByDraft(outreachDraftId: string, userId: string) {
    return OutreachFollowUpModel.find({ outreachDraftId, userId }).sort({ sequenceNumber: 1 });
  },

  findById(id: string) {
    return OutreachFollowUpModel.findById(id);
  },

  /** Cancels every not-yet-sent follow-up in a contact's sequence — the
   * enforcement point for "a reply stops all remaining sends." */
  cancelPending(outreachDraftId: string, userId: string, reason: string) {
    return OutreachFollowUpModel.updateMany(
      { outreachDraftId, userId, sent: false, cancelled: false },
      { cancelled: true, cancelReason: reason },
    );
  },

  markSent(id: string) {
    return OutreachFollowUpModel.findByIdAndUpdate(id, { sent: true }, { new: true });
  },
};
