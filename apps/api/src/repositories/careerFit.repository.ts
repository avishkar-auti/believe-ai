import { CareerFitModel } from "@believe-ai/server";

export interface CreateCareerFitRecord {
  userId: string;
  targetRole: string | null;
  summary: string;
  strengths: string[];
  skillGaps: string[];
  suggestedRoles: string[];
}

export const careerFitRepository = {
  create(data: CreateCareerFitRecord) {
    return CareerFitModel.create(data);
  },

  list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      CareerFitModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CareerFitModel.countDocuments({ userId }),
    ]);
  },

  findById(id: string, userId: string) {
    return CareerFitModel.findOne({ _id: id, userId });
  },

  delete(id: string, userId: string) {
    return CareerFitModel.findOneAndDelete({ _id: id, userId });
  },
};
