import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Caches RapidAPI LinkedIn people-search results by (company, title) so
 * repeated lead discovery for the same company doesn't re-burn RapidAPI
 * quota — mirrors YoutubeCache.model.ts's TTL-cache pattern. 7-day TTL:
 * long enough to absorb repeat runs against the same company, short enough
 * that stale profile data doesn't linger.
 */
const linkedinLeadCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    profiles: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          title: { type: String, default: null },
          linkedinUrl: { type: String, default: null },
          priorCompanies: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now, expires: "7d" },
  },
  { timestamps: false },
);

export type LinkedinLeadCacheDocument = InferSchemaType<typeof linkedinLeadCacheSchema>;
export const LinkedinLeadCacheModel = model("LinkedinLeadCache", linkedinLeadCacheSchema);
