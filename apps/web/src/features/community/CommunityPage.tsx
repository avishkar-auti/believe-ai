import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { toast } from "../../components/ui/Toast.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { createDiscussion, deleteDiscussion, fetchDiscussions, toggleUpvote } from "./discussionsApi.js";
import { CommunityFilterBar, type CommunityTab } from "./CommunityFilterBar.js";
import { QuickComposer } from "./QuickComposer.js";
import { CommunityFeed } from "./CommunityFeed.js";
import { CommunitySidebar } from "./CommunitySidebar.js";
import { CreatePostModal } from "./CreatePostModal.js";

export function CommunityPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<CommunityTab>("latest");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialTitle, setModalInitialTitle] = useState<string | undefined>();
  const [modalPlaceholder, setModalPlaceholder] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["discussions"], queryFn: () => fetchDiscussions() });

  const createMutation = useMutation({
    mutationFn: createDiscussion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setModalOpen(false);
      toast("Post published");
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: toggleUpvote,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["discussions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscussion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setPendingDeleteId(null);
      toast("Post deleted");
    },
  });

  const hasAnyPosts = (data?.total ?? 0) > 0;

  const filtered = useMemo(() => {
    let list = data?.items ?? [];
    if (tab === "top") list = [...list].sort((a, b) => b.upvoteCount - a.upvoteCount);
    else if (tab === "mine") list = list.filter((t) => t.authorId === user?.id);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
    return list;
  }, [data, tab, search, user?.id]);

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId || deepLinkHandled.current || !data) return;
    if (!data.items.some((t) => t.id === postId)) return;
    deepLinkHandled.current = true;
    setExpandedId(postId);
    requestAnimationFrame(() => {
      document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [data, searchParams]);

  const authorInitials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || user?.email?.charAt(0).toUpperCase() || "?";

  function openComposer(placeholder?: string) {
    setModalInitialTitle(undefined);
    setModalPlaceholder(placeholder);
    setModalOpen(true);
  }

  function openComposerWithPrompt(prompt: string) {
    setModalInitialTitle(prompt);
    setModalPlaceholder(undefined);
    setModalOpen(true);
  }

  return (
    <div className="max-w-content space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="flex items-center gap-2.5 text-h1 text-fg">
            <Users2 className="h-6 w-6 text-accent" /> Community
          </h1>
          <p className="mt-1.5 text-label font-normal text-fg-muted">Learn, share, and grow with the community.</p>
        </div>
        <Button onClick={() => openComposer()}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </motion.div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <CommunityFilterBar tab={tab} onTabChange={setTab} search={search} onSearchChange={setSearch} />

          <QuickComposer authorInitials={authorInitials} onCompose={openComposer} />

          <CommunityFeed
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            items={filtered}
            hasAnyPosts={hasAnyPosts}
            expandedId={expandedId}
            onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
            onUpvote={(id) => upvoteMutation.mutate(id)}
            currentUserId={user?.id}
            onRequestDelete={setPendingDeleteId}
            onCreatePost={() => openComposer()}
            onUsePrompt={openComposerWithPrompt}
          />
        </div>

        <CommunitySidebar totalPosts={data?.total} />
      </div>

      <CreatePostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTitle={modalInitialTitle}
        titlePlaceholder={modalPlaceholder}
        onSubmit={(input) => createMutation.mutate(input)}
        pending={createMutation.isPending}
        error={createMutation.isError}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this post?"
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
