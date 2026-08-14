import { connectDb as sharedConnectDb } from "@believe-ai/server";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDb(): Promise<void> {
  await sharedConnectDb(env.MONGODB_URI);
  logger.info("MongoDB connected");
}
