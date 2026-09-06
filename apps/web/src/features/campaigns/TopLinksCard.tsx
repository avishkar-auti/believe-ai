import { Award, Briefcase, Code2, FileText, Github, Globe, Layers, Linkedin } from "lucide-react";
import type { CampaignLink, LinkCategory } from "@believe-ai/shared";

const CATEGORY_META: Record<LinkCategory, { label: string; icon: typeof Award }> = {
  RESUME: { label: "Resume", icon: FileText },
  PORTFOLIO: { label: "Portfolio", icon: Briefcase },
  GITHUB: { label: "GitHub", icon: Github },
  LINKEDIN: { label: "LinkedIn", icon: Linkedin },
  PROJECT: { label: "Project", icon: Layers },
  CODING_PROFILE: { label: "Coding profile", icon: Code2 },
  CERTIFICATE: { label: "Certificate", icon: Award },
  PERSONAL_WEBSITE: { label: "Personal site", icon: Globe },
  OTHER: { label: "Link", icon: Globe },
};

/** Top Clicked Links — which of the student's own professional links
 * (resume, GitHub, portfolio…) recruiters actually opened, not sales-CRM
 * "book a call" style links. */
export function TopLinksCard({ links }: { links: CampaignLink[] }) {
  const ranked = [...links].sort((a, b) => b.clickCount - a.clickCount);
  const max = Math.max(...ranked.map((l) => l.clickCount), 1);

  if (ranked.length === 0) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">No links in this campaign's template yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {ranked.map((link) => {
        const meta = CATEGORY_META[link.category];
        const Icon = meta.icon;
        const pct = Math.round((link.clickCount / max) * 100);
        return (
          <li key={link.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-ink-800 dark:text-ink-100">
                <Icon className="h-3.5 w-3.5 text-ink-400" />
                {meta.label}
              </span>
              <span className="font-semibold text-ink-700 dark:text-ink-200">{link.clickCount}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
