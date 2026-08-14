import axios from "axios";
import type { ApiErrorResponse } from "@believe-ai/shared";
import { firebaseAuth } from "./firebase.js";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const body = err.response?.data as ApiErrorResponse | undefined;
    if (body && !body.success) {
      throw new ApiError(body.error.code, body.error.message);
    }
    throw err;
  },
);
