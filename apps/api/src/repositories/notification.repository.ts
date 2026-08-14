import { NotificationModel } from "@believe-ai/server";
import type { NotificationType } from "@believe-ai/shared";

export interface NotificationRecord {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
}

export const notificationRepository = {
  create(data: NotificationRecord) {
    return NotificationModel.create(data);
  },

  list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      NotificationModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments({ userId }),
    ]);
  },

  countUnread(userId: string) {
    return NotificationModel.countDocuments({ userId, read: false });
  },

  markRead(id: string, userId: string) {
    return NotificationModel.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
  },

  markAllRead(userId: string) {
    return NotificationModel.updateMany({ userId, read: false }, { read: true });
  },
};
