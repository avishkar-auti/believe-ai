import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Sparkles, X } from "lucide-react";
import type { SocialLinkKey, User } from "@believe-ai/shared";
import { Modal } from "../../components/ui/Modal.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { apiClient } from "../../lib/apiClient.js";
import { checkUsernameAvailable, generateProfileSummary } from "../settings/profileApi.js";
import { IdentityCard } from "../settings/IdentityCard.js";
import { HolographicIdentityCard } from "../settings/HolographicIdentityCard.js";

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

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface FormState {
  name: string;
  username: string;
  headline: string;
  location: string;
  bio: string;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
}

function emptyForm(): FormState {
  return { name: "", username: "", headline: "", location: "", bio: "", socialLinks: {} };
}

export function EditProfileDrawer({ open, user, onClose }: { open: boolean; user: User | undefined; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [visibleLinkKeys, setVisibleLinkKeys] = useState<SocialLinkKey[]>(CORE_SOCIAL_KEYS);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  useEffect(() => {
    if (user && open) {
      setForm({
        name: user.name,
        username: user.username ?? "",
        headline: user.headline ?? "",
        location: user.location ?? "",
        bio: user.bio ?? "",
        socialLinks: user.socialLinks,
      });
      const extrasWithValues = EXTRA_SOCIAL_KEYS.filter((k) => user.socialLinks[k]);
      setVisibleLinkKeys([...CORE_SOCIAL_KEYS, ...extrasWithValues]);
    }
  }, [user, open]);

  // Debounced username availability check — skips re-checking the value already saved.
  useEffect(() => {
    if (!open) return;
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
  }, [form.username, user?.username, open]);

  const summaryMutation = useMutation({
    mutationFn: () =>
      generateProfileSummary({
        name: form.name,
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
        name: form.name,
        username: form.username || null,
        headline: form.headline || null,
        location: form.location || null,
        bio: form.bio || null,
        socialLinks: form.socialLinks,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      onClose();
    },
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

  const availableExtraKeys = EXTRA_SOCIAL_KEYS.filter((k) => !visibleLinkKeys.includes(k));
  const usernameInvalid = usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking";

  const previewProfile = {
    name: form.name || "Your name",
    avatar: user?.avatar ?? null,
    headline: form.headline || null,
    bio: form.bio || null,
    socialLinks: form.socialLinks,
  };
  const cardTheme = user?.cardTheme ?? "minimal";

  return (
    <Modal
      open={open}
      title="Edit profile"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim() || usernameInvalid}>
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-section uppercase text-fg-subtle">Live preview</p>
          <div className="flex justify-center rounded-panel bg-surface-2 p-4">
            {cardTheme === "holographic" ? (
              <HolographicIdentityCard profile={previewProfile} className="max-w-full scale-[0.85]" />
            ) : (
              <IdentityCard profile={previewProfile} theme={cardTheme} className="max-w-full" />
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-label text-fg-muted">Name</span>
          <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>

        <label className="block">
          <span className="text-label text-fg-muted">Username</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">believe.ai/u/</span>
            <Input
              className="pl-[5.6rem] pr-9"
              value={form.username}
              placeholder="yourname"
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-fg-subtle" />}
              {usernameStatus === "available" && <Check className="h-4 w-4 text-positive" />}
              {(usernameStatus === "taken" || usernameStatus === "invalid") && <X className="h-4 w-4 text-critical" />}
            </span>
          </div>
          {usernameStatus === "taken" && <p className="mt-1 text-xs text-critical">That username is taken.</p>}
          {usernameStatus === "invalid" && <p className="mt-1 text-xs text-critical">3-30 characters: lowercase letters, numbers, hyphens.</p>}
        </label>

        <label className="block">
          <span className="text-label text-fg-muted">Headline</span>
          <Input
            className="mt-1"
            placeholder="Software Engineer | AI/ML | Full Stack Developer"
            value={form.headline}
            maxLength={120}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-label text-fg-muted">Location</span>
          <Input
            className="mt-1"
            placeholder="Pune, Maharashtra, India"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label text-fg-muted">Short bio</span>
            <button
              type="button"
              onClick={() => summaryMutation.mutate()}
              disabled={summaryMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {summaryMutation.isPending ? "Generating…" : form.bio ? "Regenerate" : "Generate with Believe AI"}
            </button>
          </div>
          <Textarea
            rows={2}
            maxLength={280}
            placeholder="Building AI-powered products and developer tools."
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>

        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-label text-fg-muted">Links</p>
          {visibleLinkKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-xs font-medium text-fg-subtle">{SOCIAL_LABELS[key]}</span>
              <Input className="flex-1" placeholder={`${key}.com/...`} value={form.socialLinks[key] ?? ""} onChange={(e) => setLink(key, e.target.value)} />
              {!CORE_SOCIAL_KEYS.includes(key) && (
                <button
                  type="button"
                  onClick={() => removeLink(key)}
                  className="shrink-0 rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-critical"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {availableExtraKeys.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableExtraKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVisibleLinkKeys((keys) => [...keys, key])}
                  className="inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2.5 py-1 text-xs font-medium text-fg-muted hover:border-accent hover:text-accent"
                >
                  <Plus className="h-3 w-3" /> {SOCIAL_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
