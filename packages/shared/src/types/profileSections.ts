/**
 * The LinkedIn-style Profile page's structured sections — Experience,
 * Education, Skills, Projects, Certifications, Achievements. Distinct from
 * the free-text "Believe Profile" (UserContext) fields used for AI email
 * personalization.
 */

export type ExperienceEmploymentType = "Full-time" | "Part-time" | "Internship" | "Contract" | "Freelance" | "Self-employed";

export interface Experience {
  id: string;
  title: string;
  company: string;
  employmentType: ExperienceEmploymentType;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  order: number;
}

export interface CreateExperienceInput {
  title: string;
  company: string;
  employmentType: ExperienceEmploymentType;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
}

export type UpdateExperienceInput = Partial<CreateExperienceInput>;

export interface Education {
  id: string;
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  grade: string | null;
  description: string | null;
  order: number;
}

export interface CreateEducationInput {
  school: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  grade?: string | null;
  description?: string | null;
}

export type UpdateEducationInput = Partial<CreateEducationInput>;

export type SkillCategory =
  | "Programming"
  | "Frontend"
  | "Backend"
  | "Cloud"
  | "DevOps"
  | "AI / ML"
  | "Databases"
  | "Tools"
  | "Soft Skills";

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Programming",
  "Frontend",
  "Backend",
  "Cloud",
  "DevOps",
  "AI / ML",
  "Databases",
  "Tools",
  "Soft Skills",
];

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  featured: boolean;
  order: number;
}

export interface CreateSkillInput {
  name: string;
  category: SkillCategory;
  featured?: boolean;
}

export type UpdateSkillInput = Partial<CreateSkillInput>;

export interface PortfolioProject {
  id: string;
  name: string;
  description: string | null;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  order: number;
}

export interface CreatePortfolioProjectInput {
  name: string;
  description?: string | null;
  technologies?: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
}

export type UpdatePortfolioProjectInput = Partial<CreatePortfolioProjectInput>;

export interface Certification {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string | null;
  expirationDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  order: number;
}

export interface CreateCertificationInput {
  name: string;
  issuingOrg: string;
  issueDate?: string | null;
  expirationDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
}

export type UpdateCertificationInput = Partial<CreateCertificationInput>;

export type AchievementCategory =
  | "Hackathon"
  | "Award"
  | "Competition"
  | "Scholarship"
  | "Publication"
  | "Open Source"
  | "Conference"
  | "Other";

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "Hackathon",
  "Award",
  "Competition",
  "Scholarship",
  "Publication",
  "Open Source",
  "Conference",
  "Other",
];

export interface Achievement {
  id: string;
  title: string;
  category: AchievementCategory;
  description: string | null;
  date: string | null;
  order: number;
}

export interface CreateAchievementInput {
  title: string;
  category: AchievementCategory;
  description?: string | null;
  date?: string | null;
}

export type UpdateAchievementInput = Partial<CreateAchievementInput>;

export interface ReorderInput {
  orderedIds: string[];
}
