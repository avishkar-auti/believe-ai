import type { CampaignStatus } from "@believe-ai/shared";

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  SCHEDULED: "info",
  RUNNING: "success",
  PAUSED: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  FAILED: "danger",
};
