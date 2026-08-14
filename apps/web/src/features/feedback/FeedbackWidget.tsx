import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { submitFeedback } from "./feedbackApi.js";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const submitMutation = useMutation({
    mutationFn: () => submitFeedback(message),
    onSuccess: () => setMessage(""),
  });

  function close() {
    setOpen(false);
    submitMutation.reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-ink-700 dark:hover:text-ink-200"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" /> Send feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-medium text-ink-900 dark:text-white">Send feedback</h2>
              <Button variant="ghost" size="sm" onClick={close}>
                Close
              </Button>
            </CardHeader>
            <CardBody className="space-y-3">
              {submitMutation.isSuccess ? (
                <>
                  <p className="text-sm text-lime-600">Thanks — we read every message.</p>
                  <Button className="w-full" onClick={close}>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Textarea
                    rows={4}
                    placeholder="What's working, what's not, what you'd like to see…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={() => submitMutation.mutate()}
                    disabled={!message.trim() || submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Sending…" : "Send"}
                  </Button>
                  {submitMutation.isError && <p className="text-sm text-red-600">Couldn't send — try again.</p>}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
