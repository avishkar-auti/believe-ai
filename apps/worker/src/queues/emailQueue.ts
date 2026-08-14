import { Queue } from "bullmq";
import { QUEUE_NAMES, type EmailSendJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";

export const emailQueue = new Queue<EmailSendJobData>(QUEUE_NAMES.EMAIL_SEND, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60, count: 5000 },
    removeOnFail: { age: 30 * 24 * 60 * 60 },
  },
});
