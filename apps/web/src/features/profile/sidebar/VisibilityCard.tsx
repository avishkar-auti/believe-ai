import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { apiClient } from "../../../lib/apiClient.js";

export function VisibilityCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiClient.patch<User>("/auth/me", { publicProfileEnabled: enabled });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-fg">Public profile</h2>
      </CardHeader>
      <CardBody className="space-y-3">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-fg">Visible to anyone with the link</p>
            {user.username ? (
              <p className="mt-0.5 text-caption text-fg-subtle">believe.ai/u/{user.username}</p>
            ) : (
              <p className="mt-0.5 text-caption text-fg-subtle">Set a username to enable this</p>
            )}
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-accent"
            checked={user.publicProfileEnabled}
            disabled={!user.username || toggleMutation.isPending}
            onChange={(e) => toggleMutation.mutate(e.target.checked)}
          />
        </label>
        <p className="text-caption text-fg-subtle">Change your username and links from Edit profile above.</p>
      </CardBody>
    </Card>
  );
}
