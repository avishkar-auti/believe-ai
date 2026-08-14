import { Queue } from "bullmq";
import { QUEUE_NAMES, type OutreachFollowUpJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";

export const outreachFollowUpQueue = new Queue<OutreachFollowUpJobData>(QUEUE_NAMES.OUTREACH_FOLLOW_UP, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60, count: 2000 },
    removeOnFail: { age: 30 * 24 * 60 * 60 },
  },
});
