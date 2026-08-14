import { Redis } from "ioredis";
import { env } from "./env.js";

/**
 * Single shared ioredis connection factory. BullMQ requires
 * maxRetriesPerRequest: null on any connection it owns, so queues/workers
 * should call this rather than instantiate their own client.
 */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
