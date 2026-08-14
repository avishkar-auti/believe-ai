import type { AiEmailGenerationRequest, AiEmailGenerationResult, AiImproveAction } from "@believe-ai/shared";
import { aiServiceClient } from "../../lib/aiServiceClient.js";

// The Python AI service returns the result directly (no {success,data} envelope).

export async function generateEmail(input: AiEmailGenerationRequest) {
  const res = await aiServiceClient.post<AiEmailGenerationResult>("/ai/email", input);
  return res.data;
}

export async function improveEmail(subject: string, body: string, action: AiImproveAction) {
  const res = await aiServiceClient.post<{ subject: string; body: string }>("/ai/improve", {
    subject,
    body,
    action,
  });
  return res.data;
}
