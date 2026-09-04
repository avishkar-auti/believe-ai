import type { User } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

async function upload(kind: "avatar" | "cover", file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<User>(`/profile/${kind}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export const uploadAvatar = (file: File) => upload("avatar", file);
export const uploadCoverImage = (file: File) => upload("cover", file);

export async function removeAvatar() {
  const res = await apiClient.delete<User>("/profile/avatar");
  return res.data;
}

export async function removeCoverImage() {
  const res = await apiClient.delete<User>("/profile/cover");
  return res.data;
}
