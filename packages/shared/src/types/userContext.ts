/**
 * The user's "Believe Profile" — who they are, what they offer, and who
 * they're trying to reach. Optional context fed into every AI generation
 * and personalization call so output can reference the sender's real
 * situation instead of staying generic.
 */
export interface UserContext {
  userId: string;
  aboutMe: string | null;
  companyInfo: string | null;
  servicesOrProducts: string | null;
  skillsAndExperience: string | null;
  achievements: string | null;
  targetAudience: string | null;
  updatedAt: string;
}

/**
 * Flattens a UserContext into a single string suitable for dropping into an
 * AI prompt as background context. Skips empty fields rather than emitting
 * "About me: " noise.
 */
export function formatUserContextForPrompt(context: UserContext | null): string | undefined {
  if (!context) return undefined;
  const parts = [
    context.aboutMe && `About the sender: ${context.aboutMe}`,
    context.companyInfo && `Company: ${context.companyInfo}`,
    context.servicesOrProducts && `Services/products: ${context.servicesOrProducts}`,
    context.skillsAndExperience && `Skills/experience: ${context.skillsAndExperience}`,
    context.achievements && `Achievements: ${context.achievements}`,
    context.targetAudience && `Target audience: ${context.targetAudience}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : undefined;
}
