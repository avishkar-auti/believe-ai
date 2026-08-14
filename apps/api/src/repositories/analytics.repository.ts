import mongoose from "mongoose";
import { ContactModel, CampaignModel, EmailLogModel } from "@believe-ai/server";

export const analyticsRepository = {
  async dashboardCounts(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);
    const [totalContacts, activeCampaigns, scheduledCampaigns, statusCounts] = await Promise.all([
      ContactModel.countDocuments({ userId }),
      CampaignModel.countDocuments({ userId, status: "RUNNING" }),
      CampaignModel.countDocuments({ userId, status: "SCHEDULED" }),
      EmailLogModel.aggregate<{ _id: string; count: number }>([
        { $match: { userId: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    return { totalContacts, activeCampaigns, scheduledCampaigns, statusCounts };
  },
};
