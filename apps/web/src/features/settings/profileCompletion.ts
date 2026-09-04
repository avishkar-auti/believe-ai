// Shared definition of "profile completion" — used by the Profile page's
// hero/sidebar and the Settings > Public Profile strength meter, so every
// surface agrees on the same percentage. Weights match the spec's scoring:
// photo 10, name 5, headline 10, about 10, experience 15, education 10,
// skills 10, projects 15, social links 10, achievements 5 (= 100).
export interface CompletionInput {
  avatar?: string | null;
  name?: string | null;
  headline?: string | null;
  about?: string | null;
  bio?: string | null;
  socialLinks?: Partial<Record<string, string>>;
  experienceCount?: number;
  educationCount?: number;
  skillsCount?: number;
  projectsCount?: number;
  achievementsCount?: number;
}

const WEIGHTS = {
  photo: 10,
  name: 5,
  headline: 10,
  about: 10,
  experience: 15,
  education: 10,
  skills: 10,
  projects: 15,
  social: 10,
  achievements: 5,
};

export interface CompletionItem {
  label: string;
  done: boolean;
}

export function computeProfileCompletion(input: CompletionInput) {
  const hasSocial = Boolean(input.socialLinks && Object.values(input.socialLinks).some(Boolean));
  // `about` is the long-form section; pages that don't have it yet (Settings
  // hero, Public Profile page) fall back to the short `bio` so their score
  // isn't artificially low just because they don't fetch the newer field.
  const hasAbout = Boolean(input.about?.trim() || input.bio?.trim());

  const items: (CompletionItem & { weight: number })[] = [
    { label: "Profile photo", done: Boolean(input.avatar), weight: WEIGHTS.photo },
    { label: "Name", done: Boolean(input.name?.trim()), weight: WEIGHTS.name },
    { label: "Headline", done: Boolean(input.headline?.trim()), weight: WEIGHTS.headline },
    { label: "About", done: hasAbout, weight: WEIGHTS.about },
    { label: "Experience", done: (input.experienceCount ?? 0) > 0, weight: WEIGHTS.experience },
    { label: "Education", done: (input.educationCount ?? 0) > 0, weight: WEIGHTS.education },
    { label: "Skills", done: (input.skillsCount ?? 0) > 0, weight: WEIGHTS.skills },
    { label: "Projects", done: (input.projectsCount ?? 0) > 0, weight: WEIGHTS.projects },
    { label: "Social links", done: hasSocial, weight: WEIGHTS.social },
    { label: "Achievements", done: (input.achievementsCount ?? 0) > 0, weight: WEIGHTS.achievements },
  ];

  const percent = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const done = items.filter((i) => i.done).length;
  return { percent, done, total: items.length, items: items.map(({ label, done: d }) => ({ label, done: d })) };
}
