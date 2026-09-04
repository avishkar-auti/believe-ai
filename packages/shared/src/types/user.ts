import type { PlanTier } from "../constants/plans.js";

/**
 * Canonical User type shared between the API and the web client.
 */
export type UserRole = "user" | "admin" | "recruiter";

export type CardTheme = "minimal" | "aurora" | "midnight" | "holographic";

/** Keys allowed on socialLinks — a closed set so a public profile's link
 * block always renders a known, styled icon. */
export type SocialLinkKey = "linkedin" | "github" | "leetcode" | "portfolio" | "twitter" | "kaggle" | "medium";

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  avatar: string | null;
  coverImage: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  timezone: string;
  role: UserRole;
  plan: PlanTier;
  onboardingCompleted: boolean;
  aiRecommendationsEnabled: boolean;
  username: string | null;
  headline: string | null;
  bio: string | null;
  about: string | null;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
  publicProfileEnabled: boolean;
  cardTheme: CardTheme;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  company?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  timezone?: string;
  onboardingCompleted?: boolean;
  aiRecommendationsEnabled?: boolean;
  role?: "user" | "recruiter";
  username?: string | null;
  headline?: string | null;
  bio?: string | null;
  about?: string | null;
  socialLinks?: Partial<Record<SocialLinkKey, string>>;
  publicProfileEnabled?: boolean;
  cardTheme?: CardTheme;
}

/** believe.ai/u/<username> — deliberately excludes email/plan/role/company/
 * jobTitle/onboardingCompleted, none of which belong on a page anyone on
 * the internet can load. */
export interface PublicProfile {
  username: string;
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
  cardTheme: CardTheme;
}
