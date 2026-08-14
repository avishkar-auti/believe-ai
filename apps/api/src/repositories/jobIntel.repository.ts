import { JobIntelModel } from "@believe-ai/server";
import type { CompanyIntel } from "@believe-ai/shared";

export interface CreateJobIntelRecord {
  userId: string;
  jobUrl: string;
  company: string;
  roleTitle: string;
  skills: string[];
  experienceLevel: string;
  location: string;
  hiringTeamNames: string[];
  atsKeywords: string[];
  companyIntel: CompanyIntel;
  parsingConfidence: "high" | "low";
}

export const jobIntelRepository = {
  create(data: CreateJobIntelRecord) {
    return JobIntelModel.create(data);
  },

  list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      JobIntelModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      JobIntelModel.countDocuments({ userId }),
    ]);
  },

  findById(id: string, userId: string) {
    return JobIntelModel.findOne({ _id: id, userId });
  },

  delete(id: string, userId: string) {
    return JobIntelModel.findOneAndDelete({ _id: id, userId });
  },
};
