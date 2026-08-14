import type { CampaignFollowUp, CampaignStatus } from "@believe-ai/shared";
import { CampaignModel } from "@believe-ai/server";

export interface CampaignRecord {
  userId: string;
  name: string;
  subject: string;
  templateId: string;
  audienceContactIds: string[];
  scheduledAt: Date | null;
  timezone: string;
  dailyLimit: number;
  personalizationEnabled: boolean;
  trackingEnabled: boolean;
  followUps: CampaignFollowUp[];
  stopOnReply: boolean;
}

export const campaignRepository = {
  list(userId: string, status?: CampaignStatus) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    return CampaignModel.find(filter).sort({ createdAt: -1 });
  },

  findById(id: string, userId: string) {
    return CampaignModel.findOne({ _id: id, userId });
  },

  create(data: CampaignRecord) {
    return CampaignModel.create({ ...data, status: "DRAFT" });
  },

  update(id: string, userId: string, updates: Partial<CampaignRecord>) {
    return CampaignModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
  },

  setStatus(id: string, userId: string, status: CampaignStatus) {
    return CampaignModel.findOneAndUpdate({ _id: id, userId }, { status }, { new: true });
  },

  countByUserId(userId: string) {
    return CampaignModel.countDocuments({ userId });
  },
};
