/**
 * Canonical CareerFit type — an AI-generated assessment of a resume against
 * the job market (or a specific target role), persisted so a user can look
 * back at past assessments rather than losing them on next generation.
 */
export interface CareerFit {
  id: string;
  userId: string;
  targetRole: string | null;
  summary: string;
  strengths: string[];
  skillGaps: string[];
  suggestedRoles: string[];
  createdAt: string;
}
