import { AuditLogModel } from "@believe-ai/server";
import type { AuditAction, AuditEntityType } from "@believe-ai/shared";

export interface AuditLogRecord {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  metadata: Record<string, string | number | boolean>;
  ip: string | null;
  userAgent: string | null;
}

export const auditRepository = {
  create(data: AuditLogRecord) {
    return AuditLogModel.create(data);
  },

  list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      AuditLogModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments({ userId }),
    ]);
  },
};
