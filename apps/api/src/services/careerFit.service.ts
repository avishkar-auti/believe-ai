import type { HydratedDocument } from "mongoose";
import type { CareerFit, PaginatedResult } from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { CareerFitDocument } from "@believe-ai/server";
import { careerFitRepository } from "../repositories/careerFit.repository.js";
import { getCareerFit as getCareerFitFromAiService } from "./aiServiceClient.js";
import { NotFoundError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<CareerFitDocument>): CareerFit {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    targetRole: doc.targetRole ?? null,
    summary: doc.summary,
    strengths: doc.strengths ?? [],
    skillGaps: doc.skillGaps ?? [],
    suggestedRoles: doc.suggestedRoles ?? [],
    createdAt: doc.createdAt.toISOString(),
  };
}

export const careerFitService = {
  toDto,

  /** Calls the AI service (which reads the caller's own stored resume) then persists the result. */
  async generate(userId: string, bearerToken: string, targetRole: string | null): Promise<CareerFit> {
    const result = await getCareerFitFromAiService(bearerToken, targetRole);
    const doc = await careerFitRepository.create({
      userId,
      targetRole,
      summary: result.summary,
      strengths: result.strengths,
      skillGaps: result.skillGaps,
      suggestedRoles: result.suggestedRoles,
    });
    return toDto(doc);
  },

  async list(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<CareerFit>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [items, total] = await careerFitRepository.list(userId, safePage, safeLimit);

    return {
      items: items.map(toDto),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async getById(id: string, userId: string): Promise<CareerFit> {
    const doc = await careerFitRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Career fit assessment not found");
    return toDto(doc);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await careerFitRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Career fit assessment not found");
  },
};
