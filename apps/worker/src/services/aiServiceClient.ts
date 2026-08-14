import type { AiPersonalizeRequest, AiPersonalizeResult } from "@believe-ai/shared";
import { env } from "../config/env.js";

/**
 * Calls the Python AI service (apps/ai-service) — the only AI
 * implementation in the product. Authenticated with the shared internal
 * service key since a background job has no live user session to carry a
 * Firebase token with.
 */
export async function personalizeViaAiService(req: AiPersonalizeRequest): Promise<AiPersonalizeResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/ai/personalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": env.INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(`AI service personalize failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as AiPersonalizeResult;
}
