import { Queue } from "bullmq";
import { QUEUE_NAMES, type MeetingEmailJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";

export const meetingEmailQueue = new Queue<MeetingEmailJobData>(QUEUE_NAMES.MEETING_EMAIL, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60, count: 2000 },
    removeOnFail: { age: 30 * 24 * 60 * 60 },
  },
});
