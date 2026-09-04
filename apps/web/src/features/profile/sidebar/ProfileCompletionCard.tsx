import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { User } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { computeProfileCompletion } from "../../settings/profileCompletion.js";
import { fetchExperience } from "../api/experienceApi.js";
import { fetchEducation } from "../api/educationApi.js";
import { fetchSkills } from "../api/skillsApi.js";
import { fetchProjects } from "../api/projectsApi.js";
import { fetchAchievements } from "../api/achievementsApi.js";

export function ProfileCompletionCard({ user }: { user: User | undefined }) {
  const { data: experience } = useQuery({ queryKey: ["profile", "experience"], queryFn: fetchExperience, enabled: Boolean(user) });
  const { data: education } = useQuery({ queryKey: ["profile", "education"], queryFn: fetchEducation, enabled: Boolean(user) });
  const { data: skills } = useQuery({ queryKey: ["profile", "skills"], queryFn: fetchSkills, enabled: Boolean(user) });
  const { data: projects } = useQuery({ queryKey: ["profile", "projects"], queryFn: fetchProjects, enabled: Boolean(user) });
  const { data: achievements } = useQuery({ queryKey: ["profile", "achievements"], queryFn: fetchAchievements, enabled: Boolean(user) });

  const completion = computeProfileCompletion({
    avatar: user?.avatar,
    name: user?.name,
    headline: user?.headline,
    about: user?.about,
    socialLinks: user?.socialLinks,
    experienceCount: experience?.length,
    educationCount: education?.length,
    skillsCount: skills?.length,
    projectsCount: projects?.length,
    achievementsCount: achievements?.length,
  });

  const missing = completion.items.filter((i) => !i.done);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-fg">Profile completion</h2>
      </CardHeader>
      <CardBody>
        <div className="flex items-baseline justify-between">
          <span className="text-h2 text-fg">{completion.percent}%</span>
          <span className="text-caption text-fg-subtle">
            {completion.done}/{completion.total}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-surface-2">
          <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${completion.percent}%` }} />
        </div>

        {missing.length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {missing.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-pill bg-fg-subtle" />+ Add {item.label.toLowerCase()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-positive">
            <Check className="h-4 w-4" /> Your profile is complete!
          </p>
        )}
      </CardBody>
    </Card>
  );
}
