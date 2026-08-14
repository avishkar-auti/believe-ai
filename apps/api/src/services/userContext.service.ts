import type { HydratedDocument } from "mongoose";
import type { UpdateUserContextInput, UserContext } from "@believe-ai/shared";
import type { UserContextDocument } from "@believe-ai/server";
import { userContextRepository } from "../repositories/userContext.repository.js";

function toDto(doc: HydratedDocument<UserContextDocument>): UserContext {
  return {
    userId: doc.userId.toString(),
    aboutMe: doc.aboutMe ?? null,
    companyInfo: doc.companyInfo ?? null,
    servicesOrProducts: doc.servicesOrProducts ?? null,
    skillsAndExperience: doc.skillsAndExperience ?? null,
    achievements: doc.achievements ?? null,
    targetAudience: doc.targetAudience ?? null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const userContextService = {
  /** Returns null rather than a not-found error — a Believe Profile is optional. */
  async getById(userId: string): Promise<UserContext | null> {
    const doc = await userContextRepository.findByUserId(userId);
    return doc ? toDto(doc) : null;
  },

  async update(userId: string, input: UpdateUserContextInput): Promise<UserContext> {
    const doc = await userContextRepository.upsert(userId, input);
    return toDto(doc);
  },
};
