import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
  redact: {
    paths: [
      "req.headers.authorization",
      "*.password",
      "*.accessToken",
      "*.refreshToken",
      "*.apiKey",
    ],
    censor: "[redacted]",
  },
});
