import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, type OutreachFollowUpJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { markOutreachFollowUpFailed, sendOutreachFollowUp } from "../services/sendOutreachFollowUp.js";

export function createOutreachFollowUpWorker(): Worker<OutreachFollowUpJobData> {
  const worker = new Worker<OutreachFollowUpJobData>(
    QUEUE_NAMES.OUTREACH_FOLLOW_UP,
    async (job: Job<OutreachFollowUpJobData>) => {
      await sendOutreachFollowUp(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, followUpId: job.data.followUpId }, "outreach.followup completed");
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    logger.warn(
      { jobId: job.id, followUpId: job.data.followUpId, attempt: job.attemptsMade, exhausted, err },
      "outreach.followup attempt failed",
    );
    if (exhausted) {
      await markOutreachFollowUpFailed(job.data, err.message).catch((markErr) =>
        logger.error({ markErr }, "Failed to record final outreach follow-up failure"),
      );
    }
  });

  return worker;
}
