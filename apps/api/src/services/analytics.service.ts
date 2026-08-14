import type { EmailLogStatus, EmailTrackingEntry, PaginatedResult } from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import { analyticsRepository } from "../repositories/analytics.repository.js";
import { campaignRepository } from "../repositories/campaign.repository.js";
import { campaignService } from "./campaign.service.js";
import { emailLogRepository } from "../repositories/emailLog.repository.js";

interface EmailTrackingRow {
  _id: unknown;
  campaignId: unknown;
  contactId: unknown;
  userId: unknown;
  stepIndex: number;
  status: EmailLogStatus;
  providerMessageId: string | null;
  trackingToken: string;
  openCount: number;
  clickCount: number;
  replied: boolean;
  errorMessage: string | null;
  sentAt: Date | null;
  openedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  campaignName: string;
  contactName: string;
  contactEmail: string;
}

function toEmailTrackingDto(row: EmailTrackingRow): EmailTrackingEntry {
  return {
    id: String(row._id),
    campaignId: String(row.campaignId),
    contactId: String(row.contactId),
    userId: String(row.userId),
    stepIndex: row.stepIndex,
    status: row.status,
    providerMessageId: row.providerMessageId,
    trackingToken: row.trackingToken,
    openCount: row.openCount,
    clickCount: row.clickCount,
    replied: row.replied,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt ? new Date(row.sentAt).toISOString() : null,
    openedAt: row.openedAt ? new Date(row.openedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    campaignName: row.campaignName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
  };
}

export const analyticsService = {
  async getDashboard(userId: string) {
    const [{ totalContacts, activeCampaigns, scheduledCampaigns, statusCounts }, recentCampaignDocs] =
      await Promise.all([analyticsRepository.dashboardCounts(userId), campaignRepository.list(userId)]);

    const counts: Partial<Record<EmailLogStatus, number>> = {};
    for (const row of statusCounts) counts[row._id as EmailLogStatus] = row.count;

    const emailsSent =
      (counts.SENT ?? 0) + (counts.DELIVERED ?? 0) + (counts.OPENED ?? 0) + (counts.CLICKED ?? 0) + (counts.REPLIED ?? 0);
    const opened = (counts.OPENED ?? 0) + (counts.CLICKED ?? 0) + (counts.REPLIED ?? 0);
    const clicked = (counts.CLICKED ?? 0) + (counts.REPLIED ?? 0);
    const replied = counts.REPLIED ?? 0;
    const rate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

    return {
      totalContacts,
      emailsSent,
      emailsDelivered: emailsSent,
      openRate: rate(opened, emailsSent),
      clickRate: rate(clicked, emailsSent),
      replyRate: rate(replied, emailsSent),
      activeCampaigns,
      scheduledCampaigns,
      recentCampaigns: recentCampaignDocs.slice(0, 5).map(campaignService.toDto),
    };
  },

  async getEmailTracking(userId: string, page?: number, limit?: number): Promise<PaginatedResult<EmailTrackingEntry>> {
    const pageNum = Math.max(1, page ?? 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, limit ?? DEFAULT_PAGE_SIZE));

    const { items, total } = await emailLogRepository.listByUserId(userId, pageNum, limitNum);

    return {
      items: (items as EmailTrackingRow[]).map(toEmailTrackingDto),
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    };
  },
};
