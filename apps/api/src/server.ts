import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDb } from "./config/db.js";
import { attachMockInterviewWebSocketServer } from "./ws/mockInterview.ws.js";

async function main() {
  await connectDb();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`believe.ai API listening on port ${env.PORT}`);
  });

  // Needs the raw http.Server (for the WS upgrade handshake), not the Express
  // app — this is exactly why it's wired here rather than in app.ts.
  attachMockInterviewWebSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start API server");
  process.exit(1);
});
