import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import type { CardTheme, User } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { apiClient } from "../../../lib/apiClient.js";
import { cn } from "../../../lib/cn.js";
import { fetchSkills } from "../api/skillsApi.js";
import { ShareProfileModal } from "../../settings/ShareProfileModal.js";

type CardStyle = "professional" | "3d" | "modern";

const CARD_STYLES: { value: CardStyle; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clean, flat card." },
  { value: "3d", label: "3D", description: "Holographic, tilts & flips." },
  { value: "modern", label: "Modern", description: "Dark, developer-focused card." },
];

function cardStyleFor(theme: CardTheme): CardStyle {
  if (theme === "holographic") return "3d";
  if (theme === "modern") return "modern";
  return "professional";
}

// Each style button maps to one concrete CardTheme when clicked — "professional"
// keeps whatever flat color theme was already selected rather than resetting it.
function themeForStyle(style: CardStyle, currentTheme: CardTheme): CardTheme {
  if (style === "3d") return "holographic";
  if (style === "modern") return "modern";
  return currentTheme === "holographic" || currentTheme === "modern" ? "minimal" : currentTheme;
}

const COLOR_THEMES: { value: Exclude<CardTheme, "holographic" | "modern">; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "aurora", label: "Aurora" },
  { value: "midnight", label: "Midnight" },
];

export function ShareProfileCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const canShare = Boolean(user?.username && user.publicProfileEnabled);
  // Only the Modern card needs this — fetched here (not gated on card style)
  // since the query is cheap and cached, and avoids a loading flash the
  // moment someone switches to Modern.
  const { data: skills } = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });

  const themeMutation = useMutation({
    mutationFn: async (cardTheme: CardTheme) => {
      const res = await apiClient.patch<User>("/auth/me", { cardTheme });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  if (!user) return null;

  const cardStyle = cardStyleFor(user.cardTheme);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-fg">Share your profile</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <p className="mb-2 text-label text-fg-muted">Card style</p>
          <div className="flex gap-2">
            {CARD_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => themeMutation.mutate(themeForStyle(s.value, user.cardTheme))}
                className={cn(
                  "flex-1 rounded-control border px-3 py-2 text-left text-sm font-medium transition-colors",
                  cardStyle === s.value ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong",
                )}
              >
                {s.label}
                <span className="mt-0.5 block text-xs font-normal text-fg-subtle">{s.description}</span>
              </button>
            ))}
          </div>
          {cardStyle === "professional" && (
            <div className="mt-2 flex gap-2">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => themeMutation.mutate(t.value)}
                  className={cn(
                    "rounded-control border px-3 py-1.5 text-xs font-medium transition-colors",
                    user.cardTheme === t.value ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button className="w-full" variant="secondary" disabled={!canShare} onClick={() => setOpen(true)}>
          <Share2 className="h-4 w-4" /> Share profile
        </Button>
        {!canShare && <p className="text-caption text-fg-subtle">Turn on your public profile to share it.</p>}
      </CardBody>

      {open && user.username && (
        <ShareProfileModal
          profile={{
            name: user.name,
            avatar: user.avatar,
            headline: user.headline,
            bio: user.bio,
            socialLinks: user.socialLinks,
            company: user.company,
            location: user.location,
            skills: (skills ?? []).filter((s) => s.featured).map((s) => s.name),
          }}
          theme={user.cardTheme}
          username={user.username}
          onClose={() => setOpen(false)}
        />
      )}
    </Card>
  );
}
