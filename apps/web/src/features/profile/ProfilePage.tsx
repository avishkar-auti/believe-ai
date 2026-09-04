import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { ProfileHero } from "./ProfileHero.js";
import { AboutSection } from "./sections/AboutSection.js";
import { ExperienceSection } from "./sections/ExperienceSection.js";
import { EducationSection } from "./sections/EducationSection.js";
import { SkillsSection } from "./sections/SkillsSection.js";
import { ProjectsSection } from "./sections/ProjectsSection.js";
import { CertificationsSection } from "./sections/CertificationsSection.js";
import { AchievementsSection } from "./sections/AchievementsSection.js";
import { ProfileCompletionCard } from "./sidebar/ProfileCompletionCard.js";
import { VisibilityCard } from "./sidebar/VisibilityCard.js";
import { ShareProfileCard } from "./sidebar/ShareProfileCard.js";

/** Your professional identity — not a settings form. Basic account fields
 * (name/company/timezone) and the AI-personalization "Believe Profile" stay
 * on Settings > Profile; this page is the LinkedIn-style public-facing one. */
export function ProfilePage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-6">
      <ProfileHero user={user} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <AboutSection user={user} />
          <ExperienceSection />
          <EducationSection />
          <SkillsSection />
          <ProjectsSection />
          <CertificationsSection />
          <AchievementsSection />
        </div>

        <div className="space-y-6">
          <ProfileCompletionCard user={user} />
          <VisibilityCard user={user} />
          <ShareProfileCard user={user} />
        </div>
      </div>
    </div>
  );
}
