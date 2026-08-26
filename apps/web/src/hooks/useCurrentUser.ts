import { useQuery } from "@tanstack/react-query";
import type { User } from "@believe-ai/shared";
import { apiClient } from "../lib/apiClient.js";
import { useAuth } from "../app/providers/AuthProvider.js";

export function useCurrentUser() {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["auth", "me", firebaseUser?.uid],
    enabled: Boolean(firebaseUser),
    queryFn: async () => {
      const res = await apiClient.get<User>("/auth/me");
      return res.data;
    },
  });
}
