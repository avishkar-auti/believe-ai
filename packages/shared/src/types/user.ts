import type { PlanTier } from "../constants/plans.js";

/**
 * Canonical User type shared between the API and the web client.
 */
export type UserRole = "user" | "admin" | "recruiter";

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  avatar: string | null;
  company: string | null;
  jobTitle: string | null;
  timezone: string;
  role: UserRole;
  plan: PlanTier;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
