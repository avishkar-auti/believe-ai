import type { CreateDiscussionInput, Discussion, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchDiscussions(page = 1) {
  const res = await apiClient.get<PaginatedResult<Discussion>>("/discussions/", { params: { page } });
  return res.data;
}

export async function createDiscussion(input: CreateDiscussionInput) {
  const res = await apiClient.post<Discussion>("/discussions/", input);
  return res.data;
}

export async function addReply(discussionId: string, body: string) {
  const res = await apiClient.post<Discussion>(`/discussions/${discussionId}/replies`, { body });
  return res.data;
}

export async function toggleUpvote(discussionId: string) {
  const res = await apiClient.post<Discussion>(`/discussions/${discussionId}/upvote`);
  return res.data;
}

export async function deleteDiscussion(id: string) {
  await apiClient.delete(`/discussions/${id}`);
}
