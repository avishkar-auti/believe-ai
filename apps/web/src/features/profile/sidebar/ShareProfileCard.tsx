import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import type { CardTheme, User } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { apiClient } from "../../../lib/apiClient.js";
import { cn } from "../../../lib/cn.js";
import { ShareProfileModal } from "../../settings/ShareProfileModal.js";

const CARD_STYLES: { value: "professional" | "3d"; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clean, flat card." },
  { value: "3d", label: "3D", description: "Holographic, tilts & flips." },
];

const COLOR_THEMES: { value: Exclude<CardTheme, "holographic">; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "aurora", label: "Aurora" },
  { value: "midnight", label: "Midnight" },
];

export function ShareProfileCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const canShare = Boolean(user?.username && user.publicProfileEnabled);

  const themeMutation = useMutation({
    mutationFn: async (cardTheme: CardTheme) => {
      const res = await apiClient.patch<User>("/auth/me", { cardTheme });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  if (!user) return null;

  const cardStyle = user.cardTheme === "holographic" ? "3d" : "professional";

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
                onClick={() => themeMutation.mutate(s.value === "3d" ? "holographic" : user.cardTheme === "holographic" ? "minimal" : user.cardTheme)}
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
          profile={{ name: user.name, avatar: user.avatar, headline: user.headline, bio: user.bio, socialLinks: user.socialLinks }}
          theme={user.cardTheme}
          username={user.username}
          onClose={() => setOpen(false)}
        />
      )}
    </Card>
  );
}
