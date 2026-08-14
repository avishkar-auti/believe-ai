import { DiscussionModel } from "@believe-ai/server";

export const discussionRepository = {
  list(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      DiscussionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      DiscussionModel.countDocuments(),
    ]);
  },

  findById(id: string) {
    return DiscussionModel.findById(id);
  },

  create(authorId: string, authorName: string, title: string, body: string) {
    return DiscussionModel.create({ authorId, authorName, title, body });
  },

  addReply(discussionId: string, authorId: string, authorName: string, body: string) {
    return DiscussionModel.findByIdAndUpdate(
      discussionId,
      { $push: { replies: { authorId, authorName, body } } },
      { new: true },
    );
  },

  /** Toggles in one atomic query — no read-then-write race between two concurrent clicks. */
  async toggleUpvote(discussionId: string, userId: string) {
    const alreadyUpvoted = await DiscussionModel.exists({ _id: discussionId, upvotes: userId });
    return DiscussionModel.findByIdAndUpdate(
      discussionId,
      alreadyUpvoted ? { $pull: { upvotes: userId } } : { $addToSet: { upvotes: userId } },
      { new: true },
    );
  },

  delete(id: string, authorId: string) {
    return DiscussionModel.findOneAndDelete({ _id: id, authorId });
  },
};
