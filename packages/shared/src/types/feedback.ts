/**
 * Canonical Feedback type — write-only from the product's perspective today
 * (there's no admin dashboard to list it yet, only a submit endpoint).
 * userId is null when submitted by a signed-out visitor, since auth is optional here.
 */
export type FeedbackStatus = "new" | "reviewed" | "resolved";

export interface Feedback {
  id: string;
  userId: string | null;
  message: string;
  page: string | null;
  status: FeedbackStatus;
  createdAt: string;
}
