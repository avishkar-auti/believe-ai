import type { Notification, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export type NotificationList = PaginatedResult<Notification> & { unread: number };

export async function fetchNotifications() {
  const res = await apiClient.get<NotificationList>("/notifications/", {
    params: { limit: 20 },
  });
  return res.data;
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.post("/notifications/read-all");
}
