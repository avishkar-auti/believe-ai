import axios from "axios";
import { firebaseAuth } from "./firebase.js";

/** Talks to apps/backend (FastAPI) — the sole backend now that Node has
 * been decommissioned. Carries the caller's own Firebase ID token; the
 * backend verifies it against the same Firebase project. */
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

interface FastApiErrorBody {
  detail?: string;
  success?: false;
  error?: { code: string; message: string };
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const body = err.response?.data as FastApiErrorBody | undefined;
    if (body?.error) {
      throw new ApiError(body.error.code, body.error.message);
    }
    if (body?.detail) {
      throw new ApiError("BACKEND_ERROR", body.detail);
    }
    throw err;
  },
);
