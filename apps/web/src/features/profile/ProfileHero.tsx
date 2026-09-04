import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ExternalLink, Github, Globe, Linkedin, MapPin, Pencil, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { SocialLinkKey, User } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { toast } from "../../components/ui/Toast.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";
import { cn } from "../../lib/cn.js";
import { uploadAvatar, uploadCoverImage } from "./api/profileImageApi.js";
import { EditProfileDrawer } from "./EditProfileDrawer.js";
import { ShareProfileModal } from "../settings/ShareProfileModal.js";

const SOCIAL_ICONS: Partial<Record<SocialLinkKey, typeof Github>> = { linkedin: Linkedin, github: Github };

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileHero({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      invalidate();
      toast("Profile photo updated");
    },
    onError: () => toast("Couldn't upload — check the image format and try again.", "danger"),
  });

  const coverMutation = useMutation({
    mutationFn: uploadCoverImage,
    onSuccess: () => {
      invalidate();
      toast("Cover image updated");
    },
    onError: () => toast("Couldn't upload — check the image format and try again.", "danger"),
  });

  if (!user) {
    return <div className="h-64 animate-pulse rounded-panel bg-surface shadow-card" />;
  }

  const coverUrl = resolveProfileImageUrl(user.coverImage);
  const avatarUrl = resolveProfileImageUrl(user.avatar);
  const roleLine = [user.jobTitle, user.company].filter(Boolean).join(" at ");
  const links = (Object.entries(user.socialLinks) as [SocialLinkKey, string][]).filter(([, url]) => url);
  const canShare = Boolean(user.username && user.publicProfileEnabled);

  return (
    <div className="overflow-hidden rounded-panel bg-surface shadow-card">
      <div
        className="group relative h-32 bg-gradient-to-r from-accent-soft via-accent/15 to-accent-soft bg-cover bg-center sm:h-44"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={coverMutation.isPending}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-control bg-fg/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity hover:bg-fg/70 group-hover:opacity-100 disabled:opacity-100"
        >
          <Camera className="h-3.5 w-3.5" />
          {coverMutation.isPending ? "Uploading…" : "Update cover"}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) coverMutation.mutate(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="px-6 pb-6">
        <div className="group relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full ring-4 ring-surface">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-accent-hover text-2xl font-semibold text-accent-fg">
              {initialsOf(user.name) || "?"}
            </span>
          )}
          <button
            type="button"
            aria-label="Update profile photo"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            className="absolute inset-0 flex items-center justify-center bg-fg/0 text-white opacity-0 transition-all hover:bg-fg/50 hover:opacity-100 group-hover:opacity-100"
          >
            <Camera className="h-5 w-5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) avatarMutation.mutate(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-h1 text-fg">{user.name || "Add your name"}</h1>
            {user.headline && <p className="mt-1 text-label font-medium text-accent">{user.headline}</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
              {roleLine && <span>{roleLine}</span>}
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {user.location}
                </span>
              )}
            </div>
            {user.bio && <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">{user.bio}</p>}

            {links.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {links.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key] ?? Globe;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-xs font-medium text-fg-muted",
                        "transition-colors hover:border-line-strong hover:text-fg",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {key}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShareOpen(true)} disabled={!canShare}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            {canShare && (
              <Link
                to={`/u/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-control border border-line px-3.5 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                View public <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <EditProfileDrawer open={editOpen} user={user} onClose={() => setEditOpen(false)} />

      {shareOpen && user.username && (
        <ShareProfileModal
          profile={{ name: user.name, avatar: user.avatar, headline: user.headline, bio: user.bio, socialLinks: user.socialLinks }}
          theme={user.cardTheme}
          username={user.username}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
