import type { PlanUsage } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchUsage() {
  const res = await apiClient.get<PlanUsage>("/usage/");
  return res.data;
}
