/**
 * Campaign lifecycle and related recipient/email-log types.
 */
export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * Explicit allow-list of state transitions. Anything not listed here is invalid.
 */
export const CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["SCHEDULED", "RUNNING", "CANCELLED"],
  SCHEDULED: ["RUNNING", "CANCELLED"],
  RUNNING: ["PAUSED", "COMPLETED", "CANCELLED", "FAILED"],
  PAUSED: ["RUNNING", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

/**
 * A follow-up sent some number of days after the previous step (the initial
 * send, or the prior follow-up) if the recipient hasn't replied or
 * unsubscribed by then.
 */
export interface CampaignFollowUp {
  templateId: string;
  delayDays: number;
  subjectOverride: string | null;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  templateId: string;
  /** Attached to every send in this campaign, if set. Opt-in per campaign — never auto-filled from the Primary resume. */
  resumeId?: string | null;
  audienceContactIds: string[];
  scheduledAt?: string | null;
  timezone?: string;
  dailyLimit?: number;
  personalizationEnabled?: boolean;
  trackingEnabled?: boolean;
  followUps?: CampaignFollowUp[];
  stopOnReply?: boolean;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  templateId: string;
  resumeId: string | null;
  audienceContactIds: string[];
  status: CampaignStatus;
  scheduledAt: string | null;
  timezone: string;
  dailyLimit: number;
  personalizationEnabled: boolean;
  trackingEnabled: boolean;
  followUps: CampaignFollowUp[];
  stopOnReply: boolean;
  createdAt: string;
  updatedAt: string;
}

export const EMAIL_LOG_STATUSES = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "REPLIED",
  "BOUNCED",
  "FAILED",
] as const;

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];

export interface EmailLog {
  id: string;
  campaignId: string;
  contactId: string;
  userId: string;
  /** 0 = the initial send, 1+ = index into the campaign's followUps array (1-based). */
  stepIndex: number;
  status: EmailLogStatus;
  providerMessageId: string | null;
  trackingToken: string;
  openCount: number;
  clickCount: number;
  /** Independent engagement flags — a recipient can be opened/clicked/replied all at once; see CampaignAnalytics's docs. */
  opened: boolean;
  lastOpenedAt: string | null;
  clicked: boolean;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  replied: boolean;
  replyCount: number;
  firstRepliedAt: string | null;
  lastRepliedAt: string | null;
  /** No provider webhook feeds this yet — always false/null until one exists; never inferred from silence. */
  bounced: boolean;
  bouncedAt: string | null;
  bounceReason: string | null;
  unsubscribed: boolean;
  lastActivityAt: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactCompany?: string | null;
}

/** The cross-campaign outreach dashboard's row shape — deliberately its own
 * type rather than extending EmailLog, since that endpoint predates and
 * doesn't return this feature's newer per-recipient fields. */
export interface EmailTrackingEntry {
  id: string;
  campaignId: string;
  contactId: string;
  userId: string;
  stepIndex: number;
  status: EmailLogStatus;
  providerMessageId: string | null;
  trackingToken: string;
  openCount: number;
  clickCount: number;
  replied: boolean;
  errorMessage: string | null;
  sentAt: string | null;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaignName: string;
  contactName: string;
  contactEmail: string;
}

export interface CampaignAnalytics {
  sent: number;
  /** Aliased to `sent` — no provider webhook independently confirms inbox delivery. */
  delivered: number;
  uniqueOpened: number;
  totalOpens: number;
  uniqueClicked: number;
  totalClicks: number;
  replied: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  /** Open Rate = Unique Opened / Delivered, etc. — never mixed with totals. */
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface EngagementTimeseriesPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
}

export const LINK_CATEGORIES = [
  "RESUME",
  "PORTFOLIO",
  "GITHUB",
  "LINKEDIN",
  "PROJECT",
  "CODING_PROFILE",
  "CERTIFICATE",
  "PERSONAL_WEBSITE",
  "OTHER",
] as const;

export type LinkCategory = (typeof LINK_CATEGORIES)[number];

export interface CampaignLink {
  id: string;
  url: string;
  category: LinkCategory;
  label: string | null;
  clickCount: number;
}

export const EMAIL_EVENT_TYPES = [
  "SENT",
  "OPENED",
  "CLICKED",
  "REPLIED",
  "BOUNCED",
  "FAILED",
  "UNSUBSCRIBED",
  "COMPLAINED",
] as const;

export type EmailEventType = (typeof EMAIL_EVENT_TYPES)[number];

export interface EmailEvent {
  id: string;
  type: EmailEventType;
  linkId: string | null;
  linkUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const RECIPIENT_SEGMENTS = ["opened_no_reply", "clicked_no_reply", "high_engagement_no_reply"] as const;

export type RecipientSegment = (typeof RECIPIENT_SEGMENTS)[number];

/** A deterministic, arithmetic-only observation — never an AI-invented metric. */
export interface InsightActionCard {
  icon: "trending" | "users";
  title: string;
  body: string;
}

/** Only ever a link that matches one of the user's own PortfolioProject entries by URL. */
export interface ProjectEngagement {
  id: string;
  name: string;
  description: string | null;
  url: string;
  category: LinkCategory;
  clickCount: number;
}
