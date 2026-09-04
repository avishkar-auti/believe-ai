import { useEffect, useState } from "react";
import { Drawer } from "../../components/ui/Drawer.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Spinner } from "../../components/ui/Spinner.js";

const TITLE_MAX = 200;

export function CreatePostModal({
  open,
  onClose,
  initialTitle,
  titlePlaceholder,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  /** Prefills the field with real starter text (from the empty state's example prompts). */
  initialTitle?: string;
  /** Just a hint — from the composer's quick-action chips — never persisted. */
  titlePlaceholder?: string;
  onSubmit: (input: { title: string; body: string }) => void;
  pending: boolean;
  error: boolean;
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "");
      setBody("");
    }
  }, [open, initialTitle]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && title.length <= TITLE_MAX;

  return (
    <Drawer
      open={open}
      title="Create a post"
      subtitle="Share with the community"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit({ title: title.trim(), body: body.trim() })} disabled={!canSubmit || pending}>
            {pending ? (
              <>
                <Spinner className="h-4 w-4" /> Publishing…
              </>
            ) : (
              "Publish post"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="post-title" className="text-label font-medium text-fg">
            Title
          </label>
          <Input
            id="post-title"
            className="mt-1.5"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={titlePlaceholder ?? "What would you like to discuss?"}
            autoFocus
          />
          <p className="mt-1 text-right text-caption text-fg-subtle">
            {title.length}/{TITLE_MAX}
          </p>
        </div>
        <div>
          <label htmlFor="post-body" className="text-label font-medium text-fg">
            Description
          </label>
          <Textarea
            id="post-body"
            className="mt-1.5"
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post…"
          />
        </div>
        {error && <p className="text-caption text-critical">Couldn't publish your post — try again.</p>}
      </div>
    </Drawer>
  );
}
