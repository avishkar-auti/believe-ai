import axios from "axios";
import { firebaseAuth } from "./firebase.js";
import { ApiError } from "./apiClient.js";

/**
 * Talks directly to the Python AI service (apps/ai-service) — the only AI
 * implementation in the product. The Node API no longer proxies AI calls;
 * this client carries the same Firebase ID token the Node API client uses,
 * since both services verify tokens against the same Firebase project.
 */
export const aiServiceClient = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL,
});

aiServiceClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface FastApiErrorBody {
  detail?: string;
  success?: false;
  error?: { code: string; message: string };
}

aiServiceClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const body = err.response?.data as FastApiErrorBody | undefined;
    if (body?.error) {
      throw new ApiError(body.error.code, body.error.message);
    }
    if (body?.detail) {
      throw new ApiError("AI_SERVICE_ERROR", body.detail);
    }
    throw err;
  },
);
