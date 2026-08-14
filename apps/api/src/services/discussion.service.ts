import type { HydratedDocument } from "mongoose";
import type { CreateDiscussionInput, Discussion, PaginatedResult } from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { DiscussionDocument } from "@believe-ai/server";
import { discussionRepository } from "../repositories/discussion.repository.js";
import { NotFoundError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<DiscussionDocument>, viewerId: string): Discussion {
  return {
    id: doc._id.toString(),
    authorId: doc.authorId.toString(),
    authorName: doc.authorName,
    title: doc.title,
    body: doc.body,
    replies: (doc.replies ?? []).map((r) => ({
      id: r._id.toString(),
      authorId: r.authorId.toString(),
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    })),
    upvoteCount: doc.upvotes?.length ?? 0,
    upvotedByMe: (doc.upvotes ?? []).some((id) => id.toString() === viewerId),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const discussionService = {
  toDto,

  async list(viewerId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Discussion>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [items, total] = await discussionRepository.list(safePage, safeLimit);

    return {
      items: items.map((doc) => toDto(doc, viewerId)),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async getById(id: string, viewerId: string): Promise<Discussion> {
    const doc = await discussionRepository.findById(id);
    if (!doc) throw new NotFoundError("Discussion not found");
    return toDto(doc, viewerId);
  },

  async create(authorId: string, authorName: string, input: CreateDiscussionInput): Promise<Discussion> {
    const doc = await discussionRepository.create(authorId, authorName, input.title, input.body);
    return toDto(doc, authorId);
  },

  async addReply(discussionId: string, authorId: string, authorName: string, body: string): Promise<Discussion> {
    const doc = await discussionRepository.addReply(discussionId, authorId, authorName, body);
    if (!doc) throw new NotFoundError("Discussion not found");
    return toDto(doc, authorId);
  },

  async toggleUpvote(discussionId: string, userId: string): Promise<Discussion> {
    const doc = await discussionRepository.toggleUpvote(discussionId, userId);
    if (!doc) throw new NotFoundError("Discussion not found");
    return toDto(doc, userId);
  },

  async delete(id: string, authorId: string): Promise<void> {
    const deleted = await discussionRepository.delete(id, authorId);
    if (!deleted) throw new NotFoundError("Discussion not found");
  },
};
