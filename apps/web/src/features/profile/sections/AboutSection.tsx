import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Textarea } from "../../../components/ui/Textarea.js";
import { apiClient } from "../../../lib/apiClient.js";

const MAX_LENGTH = 2000;

export function AboutSection({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) setValue(user.about ?? "");
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<User>("/auth/me", { about: value || null });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setEditing(false);
    },
  });

  function cancelEdit() {
    setEditing(false);
    setValue(user?.about ?? "");
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-h3 text-fg">About</h2>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              rows={6}
              maxLength={MAX_LENGTH}
              placeholder="Tell people about your experience, expertise, interests, and what you're working on."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-caption text-fg-subtle">
                {value.length}/{MAX_LENGTH}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : user?.about ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{user.about}</p>
        ) : (
          <p className="text-sm text-fg-subtle">
            Tell people about your experience, expertise, interests, and what you're working on.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
