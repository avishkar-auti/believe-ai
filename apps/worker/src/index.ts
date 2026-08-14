import { connectDb } from "@believe-ai/server";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createEmailWorker } from "./workers/email.worker.js";
import { createMeetingEmailWorker } from "./workers/meetingEmail.worker.js";
import { createOutreachFollowUpWorker } from "./workers/outreachFollowUp.worker.js";

async function main() {
  await connectDb(env.MONGODB_URI);
  logger.info("Worker connected to MongoDB");

  const emailWorker = createEmailWorker();
  logger.info(`believe.ai email worker started (concurrency=${env.EMAIL_SEND_CONCURRENCY})`);

  const meetingEmailWorker = createMeetingEmailWorker();
  logger.info("believe.ai meeting email worker started");

  const outreachFollowUpWorker = createOutreachFollowUpWorker();
  logger.info("believe.ai outreach follow-up worker started");

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, closing worker`);
    await Promise.all([emailWorker.close(), meetingEmailWorker.close(), outreachFollowUpWorker.close()]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start worker");
  process.exit(1);
});
