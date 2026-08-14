import type { EmailLogStatus } from "@believe-ai/shared";

export const EMAIL_LOG_STATUS_TONE: Record<EmailLogStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  QUEUED: "neutral",
  SENT: "info",
  DELIVERED: "info",
  OPENED: "warning",
  CLICKED: "success",
  REPLIED: "success",
  BOUNCED: "danger",
  FAILED: "danger",
};
