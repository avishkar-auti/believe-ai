import { RoadmapModel } from "@believe-ai/server";
import type { RoadmapDifficulty, RoadmapResourceType, SkillStatus } from "@believe-ai/shared";

export interface CreateRoadmapRecord {
  userId: string;
  goal: string;
  detectedSkills: string[];
  stages: {
    title: string;
    topics: string[];
    resources: {
      title: string;
      type: RoadmapResourceType;
      url: string | null;
      videoId?: string | null;
      channelName?: string | null;
      thumbnailUrl?: string | null;
      publishedAt?: string | null;
      durationSeconds?: number | null;
    }[];
    difficulty: RoadmapDifficulty | null;
    prerequisites: string[];
    skillStatus: SkillStatus | null;
  }[];
}

export const roadmapRepository = {
  create(data: CreateRoadmapRecord) {
    return RoadmapModel.create(data);
  },

  list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      RoadmapModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RoadmapModel.countDocuments({ userId }),
    ]);
  },

  findById(id: string, userId: string) {
    return RoadmapModel.findOne({ _id: id, userId });
  },

  delete(id: string, userId: string) {
    return RoadmapModel.findOneAndDelete({ _id: id, userId });
  },
};
