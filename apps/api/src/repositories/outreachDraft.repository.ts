import { OutreachDraftModel } from "@believe-ai/server";
import type { DraftStatus, OutreachDraftEditedText, HookConfidence } from "@believe-ai/shared";

export interface CreateOutreachDraftRecord {
  userId: string;
  jobIntelId: string;
  contactId: string;
  contactName: string;
  hook: string;
  hookConfidence: HookConfidence;
  coldEmail: string;
  linkedinNote: string;
  coverLetter: string | null;
}

export const outreachDraftRepository = {
  createMany(records: CreateOutreachDraftRecord[]) {
    return OutreachDraftModel.insertMany(records);
  },

  listByJobIntel(jobIntelId: string, userId: string) {
    return OutreachDraftModel.find({ jobIntelId, userId }).sort({ createdAt: -1 });
  },

  findById(id: string, userId: string) {
    return OutreachDraftModel.findOne({ _id: id, userId });
  },

  updateStatus(id: string, userId: string, status: DraftStatus, editedText: OutreachDraftEditedText | null) {
    return OutreachDraftModel.findOneAndUpdate({ _id: id, userId }, { status, editedText }, { new: true });
  },
};
