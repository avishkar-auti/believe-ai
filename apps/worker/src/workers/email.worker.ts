import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, type EmailSendJobData } from "@believe-ai/shared";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { markEmailLogFailed, sendCampaignEmail } from "../services/sendCampaignEmail.js";

export function createEmailWorker(): Worker<EmailSendJobData> {
  const worker = new Worker<EmailSendJobData>(
    QUEUE_NAMES.EMAIL_SEND,
    async (job: Job<EmailSendJobData>) => {
      await sendCampaignEmail(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: env.EMAIL_SEND_CONCURRENCY,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, emailLogId: job.data.emailLogId }, "email.send completed");
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    logger.warn(
      { jobId: job.id, emailLogId: job.data.emailLogId, attempt: job.attemptsMade, exhausted, err },
      "email.send attempt failed",
    );
    if (exhausted) {
      await markEmailLogFailed(job.data.emailLogId, err.message).catch((markErr) =>
        logger.error({ markErr }, "Failed to record final email failure"),
      );
    }
  });

  return worker;
}
