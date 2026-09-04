import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, MessageSquare, MoreHorizontal, ThumbsUp, Trash2 } from "lucide-react";
import type { Discussion } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Menu } from "../../components/ui/Menu.js";
import { toast } from "../../components/ui/Toast.js";
import { addReply } from "./discussionsApi.js";

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join("") || "?";
}

export function PostCard({
  thread,
  expanded,
  onToggleExpand,
  onUpvote,
  canDelete,
  onRequestDelete,
}: {
  thread: Discussion;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpvote: () => void;
  canDelete: boolean;
  onRequestDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const replyMutation = useMutation({
    mutationFn: () => addReply(thread.id, replyText),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setReplyText("");
    },
  });

  function copyLink() {
    const url = `${window.location.origin}/app/community?post=${thread.id}`;
    void navigator.clipboard.writeText(url);
    toast("Link copied");
  }

  return (
    <article
      id={`post-${thread.id}`}
      className="scroll-mt-6 rounded-card border border-line bg-surface p-5 shadow-card ring-1 ring-inset ring-fg/[0.03] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:shadow-card-hover"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {initialsOf(thread.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-semibold text-fg">{thread.authorName}</p>
          <p className="text-caption text-fg-subtle" title={new Date(thread.createdAt).toLocaleString()}>
            {timeAgo(thread.createdAt)}
          </p>
        </div>
        <Menu
          align="end"
          trigger={
            <button
              type="button"
              aria-label="Post options"
              className="rounded-control p-1.5 text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { id: "copy", label: "Copy link", icon: Link2, onSelect: copyLink },
            ...(canDelete
              ? [{ id: "delete", label: "Delete post", icon: Trash2, danger: true, onSelect: onRequestDelete }]
              : []),
          ]}
        />
      </header>

      <h3 className="mt-3 text-[16.5px] font-semibold leading-snug text-fg">{thread.title}</h3>
      <p className={cn("mt-1.5 text-sm leading-relaxed text-fg-muted", !expanded && "line-clamp-2")}>{thread.body}</p>

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onUpvote}
          aria-label={thread.upvotedByMe ? "Remove upvote" : "Upvote"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-caption font-medium transition-[transform,background-color,color] duration-150 hover:scale-105 active:scale-90",
            thread.upvotedByMe ? "bg-accent-soft text-accent" : "text-fg-subtle hover:bg-fg/[0.06] hover:text-fg",
          )}
        >
          <ThumbsUp className={cn("h-3.5 w-3.5", thread.upvotedByMe && "fill-current")} /> {thread.upvoteCount}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-caption font-medium text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
        >
          <MessageSquare className="h-3.5 w-3.5" /> {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {thread.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-fg-muted">
                {initialsOf(reply.authorName)}
              </span>
              <div className="min-w-0 flex-1 rounded-card bg-surface-2 px-3.5 py-2.5">
                <p className="text-caption font-medium text-fg">{reply.authorName}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{reply.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pl-9">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && replyText.trim() && replyMutation.mutate()}
              placeholder="Write a reply…"
              aria-label="Write a reply"
              className="h-9 flex-1 rounded-control border border-line bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
            />
            <Button size="sm" onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending}>
              {replyMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : "Reply"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
