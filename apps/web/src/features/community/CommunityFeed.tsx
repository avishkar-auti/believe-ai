import { motion } from "framer-motion";
import type { Discussion } from "@believe-ai/shared";
import { EASE, MOTION } from "../../lib/motion.js";
import { PostCard } from "./PostCard.js";
import { PostSkeleton } from "./PostSkeleton.js";
import { CommunityEmptyState } from "./CommunityEmptyState.js";
import { CommunityErrorState } from "./CommunityErrorState.js";

export function CommunityFeed({
  isLoading,
  isError,
  onRetry,
  items,
  hasAnyPosts,
  expandedId,
  onToggleExpand,
  onUpvote,
  currentUserId,
  onRequestDelete,
  onCreatePost,
  onUsePrompt,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  items: Discussion[];
  /** Whether the community has any posts at all — distinguishes "nothing has ever
   * been posted" from "no results for the current filter/search". */
  hasAnyPosts: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onUpvote: (id: string) => void;
  currentUserId: string | undefined;
  onRequestDelete: (id: string) => void;
  onCreatePost: () => void;
  onUsePrompt: (prompt: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <CommunityErrorState onRetry={onRetry} />;

  if (items.length === 0) {
    if (!hasAnyPosts) return <CommunityEmptyState onCreatePost={onCreatePost} onUsePrompt={onUsePrompt} />;
    return (
      <div className="rounded-card border border-line bg-surface px-6 py-14 text-center">
        <p className="text-sm text-fg-muted">No posts match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((thread, i) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.slow, delay: Math.min(i * 0.03, 0.3), ease: EASE }}
        >
          <PostCard
            thread={thread}
            expanded={expandedId === thread.id}
            onToggleExpand={() => onToggleExpand(thread.id)}
            onUpvote={() => onUpvote(thread.id)}
            canDelete={thread.authorId === currentUserId}
            onRequestDelete={() => onRequestDelete(thread.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}
