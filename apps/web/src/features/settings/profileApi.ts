import { apiClient } from "../../lib/apiClient.js";

export async function checkUsernameAvailable(username: string) {
  const res = await apiClient.get<{ available: boolean }>("/auth/me/username-available", { params: { u: username } });
  return res.data.available;
}

export interface ProfileSummaryRequest {
  name: string;
  headline?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  bio?: string | null;
  aboutMe?: string | null;
  skillsAndExperience?: string | null;
  achievements?: string | null;
}

export async function generateProfileSummary(input: ProfileSummaryRequest) {
  const res = await apiClient.post<{ summary: string }>("/auth/me/summary/generate", input);
  return res.data.summary;
}
