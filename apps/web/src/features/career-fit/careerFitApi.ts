import type { ApiSuccessResponse, CareerFit, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchCareerFits() {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<CareerFit>>>("/career-fit");
  return res.data.data;
}

export async function generateCareerFit(targetRole?: string) {
  const res = await apiClient.post<ApiSuccessResponse<CareerFit>>("/career-fit", { targetRole });
  return res.data.data;
}

export async function deleteCareerFit(id: string) {
  await apiClient.delete(`/career-fit/${id}`);
}
