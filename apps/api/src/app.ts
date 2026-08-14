import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { sanitizeMiddleware } from "./middleware/sanitize.middleware.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeMiddleware);
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV === "production" }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
