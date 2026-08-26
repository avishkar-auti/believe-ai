import type { PublicProfile } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

// Unauthenticated on the wire — apiClient only attaches a token when a
// Firebase session exists, so this works identically for a logged-out visitor.
export async function fetchPublicProfile(username: string) {
  const res = await apiClient.get<PublicProfile>(`/public/profile/${encodeURIComponent(username)}`);
  return res.data;
}
