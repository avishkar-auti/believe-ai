/**
 * Canonical Discussion type — a Community thread. Author name is denormalized
 * onto both the thread and each reply so the list/detail views never need a
 * separate user lookup just to render who said what.
 */
export interface CreateDiscussionInput {
  title: string;
  body: string;
}

export interface DiscussionReply {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  replies: DiscussionReply[];
  upvoteCount: number;
  /** Whether the requesting user has already upvoted — omitted from list views that don't need it. */
  upvotedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}
