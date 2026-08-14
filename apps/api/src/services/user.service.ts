import { DEFAULT_PLAN_TIER, type PlanTier, type User } from "@believe-ai/shared";
import type { HydratedDocument } from "mongoose";
import type { UserDocument } from "@believe-ai/server";
import { userRepository } from "../repositories/user.repository.js";
import { NotFoundError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<UserDocument>): User {
  return {
    id: doc._id.toString(),
    firebaseUid: doc.firebaseUid,
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar ?? null,
    company: doc.company ?? null,
    jobTitle: doc.jobTitle ?? null,
    timezone: doc.timezone,
    role: doc.role as User["role"],
    // Users created before the plan field existed have no value stored.
    plan: (doc.plan as PlanTier) ?? DEFAULT_PLAN_TIER,
    onboardingCompleted: doc.onboardingCompleted,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const userService = {
  toDto,

  /** Finds the user for a Firebase UID, creating one on first sign-in. */
  async findOrCreateByFirebaseUid(params: {
    firebaseUid: string;
    email: string;
    name: string;
    avatar: string | null;
  }) {
    const existing = await userRepository.findByFirebaseUid(params.firebaseUid);
    if (existing) return existing;
    return userRepository.create({
      firebaseUid: params.firebaseUid,
      email: params.email,
      name: params.name,
      avatar: params.avatar,
    });
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return toDto(user);
  },

  async updateProfile(
    id: string,
    updates: Partial<{
      name: string;
      company: string | null;
      jobTitle: string | null;
      timezone: string;
      onboardingCompleted: boolean;
      role: "user" | "recruiter";
    }>,
  ) {
    const user = await userRepository.updateProfile(id, updates);
    if (!user) throw new NotFoundError("User not found");
    return toDto(user);
  },
};
