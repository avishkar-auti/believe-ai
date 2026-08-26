import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Sparkles, X } from "lucide-react";
import type { CardTheme, SocialLinkKey, User } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { apiClient } from "../../lib/apiClient.js";
import { cn } from "../../lib/cn.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { IdentityCard } from "./IdentityCard.js";
import { HolographicIdentityCard } from "./HolographicIdentityCard.js";
import { ShareProfileModal } from "./ShareProfileModal.js";
import { checkUsernameAvailable, generateProfileSummary } from "./profileApi.js";

const CORE_SOCIAL_KEYS: SocialLinkKey[] = ["linkedin", "github", "leetcode"];
const EXTRA_SOCIAL_KEYS: SocialLinkKey[] = ["portfolio", "twitter", "kaggle", "medium"];
const SOCIAL_LABELS: Record<SocialLinkKey, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  leetcode: "LeetCode",
  portfolio: "Portfolio",
  twitter: "X / Twitter",
  kaggle: "Kaggle",
  medium: "Medium",
};

const CARD_STYLES: { value: "professional" | "3d"; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clean, flat card." },
  { value: "3d", label: "3D", description: "Holographic, tilts & flips." },
];

const COLOR_THEMES: { value: Exclude<CardTheme, "holographic">; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "aurora", label: "Aurora" },
  { value: "midnight", label: "Midnight" },
];

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface FormState {
  username: string;
  headline: string;
  bio: string;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
  publicProfileEnabled: boolean;
  cardTheme: CardTheme;
}

function emptyForm(): FormState {
  return { username: "", headline: "", bio: "", socialLinks: {}, publicProfileEnabled: false, cardTheme: "minimal" };
}

export function PublicProfileSettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [visibleLinkKeys, setVisibleLinkKeys] = useState<SocialLinkKey[]>(CORE_SOCIAL_KEYS);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username ?? "",
      headline: user.headline ?? "",
      bio: user.bio ?? "",
      socialLinks: user.socialLinks,
      publicProfileEnabled: user.publicProfileEnabled,
      cardTheme: user.cardTheme,
    });
    const extrasWithValues = EXTRA_SOCIAL_KEYS.filter((k) => user.socialLinks[k]);
    setVisibleLinkKeys([...CORE_SOCIAL_KEYS, ...extrasWithValues]);
  }, [user]);

  // Debounced username availability check — skips re-checking the value already saved.
  useEffect(() => {
    const value = form.username.trim().toLowerCase();
    if (!value) {
      setUsernameStatus("idle");
      return;
    }
    if (value === user?.username) {
      setUsernameStatus("available");
      return;
    }
    if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(() => {
      checkUsernameAvailable(value)
        .then((available) => setUsernameStatus(available ? "available" : "taken"))
        .catch(() => setUsernameStatus("idle"));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.username, user?.username]);

  const summaryMutation = useMutation({
    mutationFn: () =>
      generateProfileSummary({
        name: user?.name ?? "",
        headline: form.headline || null,
        jobTitle: user?.jobTitle ?? null,
        company: user?.company ?? null,
        bio: form.bio || null,
      }),
    onSuccess: (summary) => setForm((f) => ({ ...f, bio: summary })),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<User>("/auth/me", {
        username: form.username || null,
        headline: form.headline || null,
        bio: form.bio || null,
        socialLinks: form.socialLinks,
        publicProfileEnabled: form.publicProfileEnabled,
        cardTheme: form.cardTheme,
      });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  function setLink(key: SocialLinkKey, url: string) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: url } }));
  }

  function removeLink(key: SocialLinkKey) {
    setForm((f) => {
      const next = { ...f.socialLinks };
      delete next[key];
      return { ...f, socialLinks: next };
    });
    setVisibleLinkKeys((keys) => keys.filter((k) => k !== key));
  }

  const previewProfile = useMemo(
    () => ({ name: user?.name ?? "", avatar: user?.avatar ?? null, headline: form.headline || null, bio: form.bio || null, socialLinks: form.socialLinks }),
    [user, form.headline, form.bio, form.socialLinks],
  );

  const completeness = useMemo(() => {
    const checks = [
      Boolean(user?.avatar),
      Boolean(form.headline.trim()),
      Boolean(form.bio.trim()),
      Boolean(form.socialLinks.linkedin),
      Boolean(form.socialLinks.github),
    ];
    const done = checks.filter(Boolean).length;
    return { percent: Math.round((done / checks.length) * 100), done, total: checks.length };
  }, [user?.avatar, form.headline, form.bio, form.socialLinks]);

  const cardStyle = form.cardTheme === "holographic" ? "3d" : "professional";
  const canShare = Boolean(user?.username && user.publicProfileEnabled && user.username === form.username && form.publicProfileEnabled);
  const availableExtraKeys = EXTRA_SOCIAL_KEYS.filter((k) => !visibleLinkKeys.includes(k));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Public Profile</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Control how your professional identity appears on believe.ai.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardBody className="space-y-5">
            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Username
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">believe.ai/u/</span>
                <Input
                  className="pl-[5.6rem] pr-9"
                  value={form.username}
                  placeholder="yourname"
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
                  {usernameStatus === "available" && <Check className="h-4 w-4 text-lime-600" />}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && <X className="h-4 w-4 text-red-500" />}
                </span>
              </div>
              {usernameStatus === "taken" && <p className="mt-1 text-xs text-red-600">That username is taken.</p>}
              {usernameStatus === "invalid" && (
                <p className="mt-1 text-xs text-red-600">3-30 characters: lowercase letters, numbers, hyphens.</p>
              )}
            </label>

            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Headline
              <Input
                className="mt-1"
                placeholder="AI Engineer • Developer"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              />
            </label>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-ink-600 dark:text-ink-300">One-line summary</span>
                <button
                  type="button"
                  onClick={() => summaryMutation.mutate()}
                  disabled={summaryMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-300"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {summaryMutation.isPending ? "Generating…" : form.bio ? "Regenerate" : "Generate with Believe AI"}
                </button>
              </div>
              <Textarea
                rows={2}
                placeholder="Building intelligent systems with AI, agents & modern software engineering."
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-ink-600 dark:text-ink-300">Social links</p>
              <div className="space-y-2">
                {visibleLinkKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs font-medium text-ink-500 dark:text-ink-400">{SOCIAL_LABELS[key]}</span>
                    <Input
                      className="flex-1"
                      placeholder={`${key}.com/...`}
                      value={form.socialLinks[key] ?? ""}
                      onChange={(e) => setLink(key, e.target.value)}
                    />
                    {!CORE_SOCIAL_KEYS.includes(key) && (
                      <button
                        type="button"
                        onClick={() => removeLink(key)}
                        className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-red-500 dark:hover:bg-ink-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {availableExtraKeys.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {availableExtraKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setVisibleLinkKeys((keys) => [...keys, key])}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-500 hover:border-brand-400 hover:text-brand-600 dark:border-ink-600 dark:text-ink-400"
                    >
                      <Plus className="h-3 w-3" /> {SOCIAL_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm text-ink-600 dark:text-ink-300">Card style</p>
              <div className="flex gap-2">
                {CARD_STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        cardTheme: s.value === "3d" ? "holographic" : f.cardTheme === "holographic" ? "minimal" : f.cardTheme,
                      }))
                    }
                    className={cn(
                      "flex-1 rounded-xl border px-3.5 py-2 text-left text-sm font-medium transition-colors",
                      cardStyle === s.value
                        ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                        : "border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400",
                    )}
                  >
                    {s.label}
                    <span className="mt-0.5 block text-xs font-normal text-ink-400">{s.description}</span>
                  </button>
                ))}
              </div>
              {cardStyle === "professional" && (
                <div className="mt-2 flex gap-2">
                  {COLOR_THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, cardTheme: t.value }))}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                        form.cardTheme === t.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                          : "border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center justify-between rounded-xl border border-ink-100 p-3 dark:border-ink-800">
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Make profile public</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Anyone with your link can view it.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand-500"
                checked={form.publicProfileEnabled}
                onChange={(e) => setForm((f) => ({ ...f, publicProfileEnabled: e.target.checked }))}
              />
            </label>

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking"}
              >
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              {saveMutation.isSuccess && <span className="text-sm text-lime-600">Saved.</span>}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody className="flex flex-col items-center gap-4">
              <p className="self-start text-xs font-semibold uppercase tracking-wider text-ink-400">Live preview</p>
              {cardStyle === "3d" ? (
                <HolographicIdentityCard profile={previewProfile} className="max-w-full" />
              ) : (
                <IdentityCard profile={previewProfile} theme={form.cardTheme} className="max-w-full" />
              )}

              <div className="w-full">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-600 dark:text-ink-300">Profile strength</span>
                  <span className="text-ink-400">{completeness.percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${completeness.percent}%` }} />
                </div>
              </div>

              <Button className="w-full" disabled={!canShare} onClick={() => setShareOpen(true)}>
                Share profile
              </Button>
              {!canShare && (
                <p className="text-center text-xs text-ink-400">
                  {form.username ? "Save your changes and turn on public profile to share it." : "Set a username to enable sharing."}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {shareOpen && user?.username && (
        <ShareProfileModal profile={previewProfile} theme={form.cardTheme} username={user.username} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
