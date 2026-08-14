import { MockInterviewRoomModel } from "@believe-ai/server";

export interface CreateRoomRecord {
  code: string;
  hostUserId: string;
  hostName: string;
  guestEmail: string | null;
  scheduledAt: Date;
  durationMinutes: number;
}

export const mockInterviewRoomRepository = {
  create(data: CreateRoomRecord) {
    return MockInterviewRoomModel.create(data);
  },

  findByCode(code: string) {
    return MockInterviewRoomModel.findOne({ code });
  },

  findById(id: string) {
    return MockInterviewRoomModel.findById(id);
  },

  /** Upcoming and past, most recent first — a host's own scheduling history. */
  listByHost(hostUserId: string) {
    return MockInterviewRoomModel.find({ hostUserId }).sort({ scheduledAt: -1 }).limit(100);
  },

  cancel(id: string, hostUserId: string) {
    return MockInterviewRoomModel.findOneAndUpdate(
      { _id: id, hostUserId, status: "scheduled" },
      { status: "cancelled" },
      { new: true },
    );
  },
};
