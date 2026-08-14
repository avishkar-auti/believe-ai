import { JobLeadModel } from "@believe-ai/server";

export interface CreateJobLeadRecord {
  userId: string;
  jobIntelId: string;
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  relevanceRank: number;
  warmPath: boolean;
  warmPathReason: string | null;
  workEmailPattern: string | null;
}

export const jobLeadRepository = {
  /** Only clears leads the user hasn't already promoted to a real Contact —
   * a re-run of discovery should refresh stale suggestions, never orphan one
   * that's already been added to the address book. */
  deleteUnaddedByJobIntel(jobIntelId: string, userId: string) {
    return JobLeadModel.deleteMany({ jobIntelId, userId, addedContactId: null });
  },

  createMany(records: CreateJobLeadRecord[]) {
    return JobLeadModel.insertMany(records);
  },

  listByJobIntel(jobIntelId: string, userId: string) {
    return JobLeadModel.find({ jobIntelId, userId }).sort({ relevanceRank: 1 });
  },

  findById(id: string, userId: string) {
    return JobLeadModel.findOne({ _id: id, userId });
  },

  markAdded(id: string, userId: string, contactId: string) {
    return JobLeadModel.findOneAndUpdate({ _id: id, userId }, { addedContactId: contactId }, { new: true });
  },
};
