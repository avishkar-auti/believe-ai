import type { Request } from "express";
import type { HydratedDocument } from "mongoose";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type AuditAction,
  type AuditEntityType,
  type AuditLog,
  type PaginatedResult,
} from "@believe-ai/shared";
import type { AuditLogDocument } from "@believe-ai/server";
import { auditRepository } from "../repositories/audit.repository.js";
import { logger } from "../config/logger.js";

function toDto(doc: HydratedDocument<AuditLogDocument>): AuditLog {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    action: doc.action as AuditAction,
    entityType: doc.entityType as AuditEntityType,
    entityId: doc.entityId ?? null,
    metadata: (doc.metadata ?? {}) as AuditLog["metadata"],
    ip: doc.ip ?? null,
    userAgent: doc.userAgent ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface RecordAuditInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean>;
  /**
   * Explicit actor, for routes that aren't behind authMiddleware and so
   * have no req.userId — currently the OAuth callbacks, where identity
   * arrives via the `state` parameter instead.
   */
  userId?: string;
}

export const auditService = {
  /**
   * Writes an audit entry. Deliberately swallows its own failures: an audit
   * write must never break the user action it's describing. Failures are
   * logged so a silently-broken audit trail is still visible in logs.
   */
  async record(req: Request, input: RecordAuditInput): Promise<void> {
    const userId = input.userId ?? req.userId;
    if (!userId) return;
    try {
      await auditRepository.create({
        userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });
    } catch (err) {
      logger.error({ err, action: input.action }, "Failed to write audit log");
    }
  },

  async list(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<AuditLog>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [items, total] = await auditRepository.list(userId, safePage, safeLimit);

    return {
      items: items.map(toDto),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },
};
