import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Caches YouTube Data API search results by query so repeated roadmap
 * generations for the same topic don't burn API quota. TTL-expires after 7
 * days — long enough to absorb repeat searches, short enough that view
 * counts/rankings don't go stale for long.
 */
const youtubeCacheSchema = new Schema(
  {
    query: { type: String, required: true, unique: true },
    videos: {
      type: [
        {
          _id: false,
          videoId: { type: String, required: true },
          title: { type: String, required: true },
          channelName: { type: String, required: true },
          thumbnailUrl: { type: String, required: true },
          description: { type: String, default: "" },
          publishedAt: { type: String, required: true },
          url: { type: String, required: true },
          durationSeconds: { type: Number, default: null },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now, expires: "7d" },
  },
  { timestamps: false },
);

export type YoutubeCacheDocument = InferSchemaType<typeof youtubeCacheSchema>;
export const YoutubeCacheModel = model("YoutubeCache", youtubeCacheSchema);
