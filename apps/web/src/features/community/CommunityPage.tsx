import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowBigUp, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import type { Discussion } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { addReply, createDiscussion, deleteDiscussion, fetchDiscussions, toggleUpvote } from "./discussionsApi.js";

export function CommunityPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["discussions"], queryFn: () => fetchDiscussions() });

  const createMutation = useMutation({
    mutationFn: () => createDiscussion({ title, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setTitle("");
      setBody("");
      setShowForm(false);
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: toggleUpvote,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["discussions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscussion,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["discussions"] }),
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <Users className="h-5 w-5 text-brand-500" /> Community
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Ask questions, share wins, swap advice.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New post"}
        </Button>
      </motion.div>

      {showForm && (
        <Card>
          <CardBody className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea rows={4} placeholder="What's on your mind?" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !body.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Posting…" : "Post"}
            </Button>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No posts yet" description="Start the conversation above." />
      ) : (
        <div className="space-y-3">
          {data.items.map((thread, i) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
            >
              <ThreadCard
                thread={thread}
                expanded={expandedId === thread.id}
                onToggleExpand={() => setExpandedId((id) => (id === thread.id ? null : thread.id))}
                onUpvote={() => upvoteMutation.mutate(thread.id)}
                canDelete={thread.authorId === user?.id}
                onDelete={() => deleteMutation.mutate(thread.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  expanded,
  onToggleExpand,
  onUpvote,
  canDelete,
  onDelete,
}: {
  thread: Discussion;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpvote: () => void;
  canDelete: boolean;
  onDelete: () => void;
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

  return (
    <Card className="transition-shadow duration-300 hover:shadow-lift">
      <CardBody className="space-y-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onUpvote}
            className={`flex flex-col items-center rounded-lg px-2 py-1 text-xs transition-transform duration-150 hover:scale-105 active:scale-95 ${
              thread.upvotedByMe
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                : "text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"
            }`}
          >
            <ArrowBigUp className="h-4 w-4" />
            {thread.upvoteCount}
          </button>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onToggleExpand}>
            <h3 className="font-medium text-ink-900 dark:text-white">{thread.title}</h3>
            <p className="text-xs text-ink-400">{thread.authorName} · {new Date(thread.createdAt).toLocaleDateString()}</p>
            <p className={`mt-1 text-sm text-ink-600 dark:text-ink-300 ${expanded ? "" : "line-clamp-2"}`}>{thread.body}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-ink-400">
              <MessageSquare className="h-3.5 w-3.5" /> {thread.replies.length} replies
            </p>
          </div>
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {expanded && (
          <div className="ml-9 space-y-3 border-t border-ink-100 pt-3 dark:border-ink-800">
            {thread.replies.map((reply) => (
              <div key={reply.id} className="rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
                <p className="text-xs font-medium text-ink-700 dark:text-ink-200">{reply.authorName}</p>
                <p className="mt-0.5 text-ink-600 dark:text-ink-300">{reply.body}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className="h-9 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && replyText.trim() && replyMutation.mutate()}
              />
              <Button size="sm" onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
