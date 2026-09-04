import { apiClient } from "./apiClient.js";

/** User.avatar/coverImage is either an external absolute URL (Google's
 * Firebase photo_url, set at signup) or our own relative path from an
 * uploaded image (`/public/avatar/<userId>`). The relative case needs the
 * backend's own origin prefixed — same resolution notesApi.ts's
 * attachmentUrl() does for note attachments. */
export function resolveProfileImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${apiClient.defaults.baseURL}${path}`;
}
