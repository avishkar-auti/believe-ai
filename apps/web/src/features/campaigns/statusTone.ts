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

export const CAMPAIGN_STATUS_DOT: Record<CampaignStatus, string> = {
  DRAFT: "bg-ink-400",
  SCHEDULED: "bg-blue-500",
  RUNNING: "bg-lime-500",
  PAUSED: "bg-amber-500",
  COMPLETED: "bg-lime-500",
  CANCELLED: "bg-red-500",
  FAILED: "bg-red-500",
};
