import type { HydratedDocument } from "mongoose";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Notification,
  type NotificationType,
  type PaginatedResult,
} from "@believe-ai/shared";
import type { NotificationDocument } from "@believe-ai/server";
import { notificationRepository } from "../repositories/notification.repository.js";
import { logger } from "../config/logger.js";
import { NotFoundError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<NotificationDocument>): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type as NotificationType,
    title: doc.title,
    body: doc.body ?? "",
    link: doc.link ?? null,
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

export const notificationService = {
  /**
   * Like audit writes, a failed notification must never break the action
   * that triggered it — an import shouldn't 500 because the bell couldn't
   * be updated.
   */
  async create(userId: string, input: CreateNotificationInput): Promise<void> {
    try {
      await notificationRepository.create({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      });
    } catch (err) {
      logger.error({ err, type: input.type }, "Failed to create notification");
    }
  },

  async list(
    userId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<Notification> & { unread: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [[items, total], unread] = await Promise.all([
      notificationRepository.list(userId, safePage, safeLimit),
      notificationRepository.countUnread(userId),
    ]);

    return {
      items: items.map(toDto),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      unread,
    };
  },

  async markRead(id: string, userId: string): Promise<Notification> {
    const doc = await notificationRepository.markRead(id, userId);
    if (!doc) throw new NotFoundError("Notification not found");
    return toDto(doc);
  },

  async markAllRead(userId: string): Promise<number> {
    const result = await notificationRepository.markAllRead(userId);
    return result.modifiedCount;
  },
};
