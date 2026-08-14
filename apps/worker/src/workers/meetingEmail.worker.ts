import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, type MeetingEmailJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { sendMeetingEmail } from "../services/sendMeetingEmail.js";

export function createMeetingEmailWorker(): Worker<MeetingEmailJobData> {
  const worker = new Worker<MeetingEmailJobData>(
    QUEUE_NAMES.MEETING_EMAIL,
    async (job: Job<MeetingEmailJobData>) => {
      await sendMeetingEmail(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, roomId: job.data.roomId, kind: job.data.kind }, "meeting.email completed");
  });

  worker.on("failed", (job, err) => {
    if (!job) return;
    logger.warn({ jobId: job.id, roomId: job.data.roomId, kind: job.data.kind, err }, "meeting.email attempt failed");
  });

  return worker;
}
