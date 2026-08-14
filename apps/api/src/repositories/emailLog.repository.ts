import mongoose from "mongoose";
import { EmailLogModel } from "@believe-ai/server";

/**
 * Engagement funnel order. A status is only advanced when the current one sits
 * earlier in the funnel, so terminal states (REPLIED, BOUNCED, FAILED) are
 * never clobbered by a late open or click.
 */
const PRE_OPEN_STATUSES = ["QUEUED", "SENT", "DELIVERED"];
const PRE_CLICK_STATUSES = [...PRE_OPEN_STATUSES, "OPENED"];

export interface EmailLogRecord {
  campaignId: string;
  contactId: string;
  userId: string;
  trackingToken: string;
  stepIndex?: number;
}

export const emailLogRepository = {
  insertMany(records: EmailLogRecord[]) {
    return EmailLogModel.insertMany(records.map((r) => ({ ...r, status: "QUEUED" })));
  },

  findQueuedByCampaign(campaignId: string) {
    return EmailLogModel.find({ campaignId, status: "QUEUED" });
  },

  findById(id: string) {
    return EmailLogModel.findById(id);
  },

  findByTrackingToken(token: string) {
    return EmailLogModel.findOne({ trackingToken: token });
  },

  /** Most recent EmailLog for a contact within a campaign, across every step. */
  findLatestForContact(campaignId: string, contactId: string) {
    return EmailLogModel.findOne({ campaignId, contactId }).sort({ stepIndex: -1 });
  },

  aggregateByCampaign(campaignId: string) {
    return EmailLogModel.aggregate<{ _id: string; count: number }>([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
  },

  list(campaignId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      EmailLogModel.find({ campaignId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EmailLogModel.countDocuments({ campaignId }),
    ]);
  },

  /** Cross-campaign delivery/engagement view for a user, newest first, with campaign/contact names joined in. */
  async listByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const match = { userId: new mongoose.Types.ObjectId(userId) };

    const [rows, [countRow]] = await Promise.all([
      EmailLogModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: "campaigns", localField: "campaignId", foreignField: "_id", as: "campaign" } },
        { $lookup: { from: "contacts", localField: "contactId", foreignField: "_id", as: "contact" } },
        { $unwind: "$campaign" },
        { $unwind: "$contact" },
        {
          $project: {
            campaignId: 1,
            contactId: 1,
            userId: 1,
            stepIndex: 1,
            status: 1,
            providerMessageId: 1,
            trackingToken: 1,
            openCount: 1,
            clickCount: 1,
            replied: 1,
            errorMessage: 1,
            sentAt: 1,
            openedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            campaignName: "$campaign.name",
            contactName: { $trim: { input: { $concat: ["$contact.firstName", " ", { $ifNull: ["$contact.lastName", ""] }] } } },
            contactEmail: "$contact.email",
          },
        },
      ]),
      EmailLogModel.aggregate<{ _id: null; count: number }>([{ $match: match }, { $count: "count" }]),
    ]);

    return { items: rows, total: countRow?.count ?? 0 };
  },

  /**
   * Opens and clicks can arrive repeatedly and out of order — mail clients
   * re-fetch pixels, and a recipient may click days after replying. Analytics
   * reads status as a funnel (opened = OPENED+CLICKED+REPLIED), so status must
   * only ever move forward; a naive $set would downgrade REPLIED back to
   * OPENED and quietly erode the reply rate. These use aggregation-pipeline
   * updates so the guard is atomic rather than a read-then-write race.
   */
  incrementOpen(trackingToken: string) {
    return EmailLogModel.findOneAndUpdate(
      { trackingToken },
      [
        {
          $set: {
            openCount: { $add: ["$openCount", 1] },
            // First open is the meaningful one; later re-fetches must not overwrite it.
            openedAt: { $ifNull: ["$openedAt", new Date()] },
            status: {
              $cond: [{ $in: ["$status", PRE_OPEN_STATUSES] }, "OPENED", "$status"],
            },
          },
        },
      ],
      { new: true },
    );
  },

  incrementClick(trackingToken: string) {
    return EmailLogModel.findOneAndUpdate(
      { trackingToken },
      [
        {
          $set: {
            clickCount: { $add: ["$clickCount", 1] },
            // A click proves the message was opened, even if the pixel was blocked.
            openedAt: { $ifNull: ["$openedAt", new Date()] },
            status: {
              $cond: [{ $in: ["$status", PRE_CLICK_STATUSES] }, "CLICKED", "$status"],
            },
          },
        },
      ],
      { new: true },
    );
  },

  markReplied(id: string) {
    return EmailLogModel.findByIdAndUpdate(id, { replied: true, status: "REPLIED" }, { new: true });
  },

  /**
   * Emails actually sent by this user since `since` — counts by sentAt, so
   * queued-but-unsent recipients don't consume the daily allowance.
   */
  countSentSince(userId: string, since: Date) {
    return EmailLogModel.countDocuments({ userId, sentAt: { $gte: since } });
  },
};
