/**
 * In-app notifications (spec 42) — surfaced in the topbar bell.
 */
export const NOTIFICATION_TYPES = [
  "campaign.completed",
  "contacts.imported",
  "integration.disconnected",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** In-app route the notification points at, if any. */
  link: string | null;
  read: boolean;
  createdAt: string;
}
