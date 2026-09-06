import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { Z } from "../../lib/zIndex.js";
import { MOTION } from "../../lib/motion.js";
import { usePersonalizationContext } from "./usePersonalization.js";

interface SignOff {
  id: string;
  label: string;
  /** Rendered with real profile values so the button previews what it inserts. */
  preview: string;
  /** What actually goes into the template — still raw {{tokens}}, never the
   * resolved text. That's the whole point: edit your profile later and every
   * sign-off already in every template updates with it. */
  html: string;
}

/** "Add sign-off", built from the profile rather than a fixed string.
 *
 * The old version always appended "{{senderName}} / {{linkedin}} | {{github}}",
 * which quietly produced "Best regards, | " for anyone who hadn't added those
 * links. Options here only offer what the profile can actually fill. */
export function SignOffPicker({ onInsert }: { onInsert: (html: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = usePersonalizationContext();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const byKey = new Map(data?.variables.map((v) => [v.key, v]) ?? []);
  const configured = (key: string) => byKey.get(key)?.configured ?? false;
  const shown = (key: string, fallback: string) => byKey.get(key)?.currentValue ?? fallback;

  const links = ["linkedin", "github", "portfolio"].filter(configured);
  const name = shown("senderName", "your name");

  const options: SignOff[] = [
    {
      id: "simple",
      label: "Name only",
      preview: `Best regards,\n${name}`,
      html: "<p>Best regards,<br>{{senderName}}</p>",
    },
  ];

  if (configured("senderTitle")) {
    options.push({
      id: "title",
      label: "Name and title",
      preview: `Best regards,\n${name}\n${shown("senderTitle", "")}`,
      html: "<p>Best regards,<br>{{senderName}}<br>{{senderTitle}}</p>",
    });
  }

  if (links.length > 0) {
    const labels = links.map((k) => byKey.get(k)?.label ?? k);
    options.push({
      id: "links",
      label: `Name and ${labels.join(" / ")}`,
      preview: `Best regards,\n${name}\n${labels.join(" | ")}`,
      html: `<p>Best regards,<br>{{senderName}}<br>${links.map((k) => `{{${k}}}`).join(" | ")}</p>`,
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-pill border border-dashed px-2.5 py-1 text-xs font-medium transition-colors",
          open ? "border-accent text-accent" : "border-line-strong text-fg-muted hover:border-accent hover:text-accent",
        )}
      >
        <PenLine className="h-3 w-3" /> Add sign-off
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: MOTION.fast }}
            role="menu"
            className={cn("absolute right-0 mt-1 w-72 rounded-xl surface-3 surface-edge p-1.5 shadow-lift", Z.menu)}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onInsert(option.html);
                }}
                className="block w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-fg/[0.06]"
              >
                <span className="block text-label text-fg">{option.label}</span>
                <span className="mt-0.5 block whitespace-pre-line text-[11px] leading-snug text-fg-subtle">{option.preview}</span>
              </button>
            ))}

            {links.length < 3 && (
              <Link
                to="/app/settings/profile"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg border border-dashed border-line-strong px-2.5 py-2 text-[11px] text-fg-subtle transition-colors hover:border-accent hover:text-accent"
              >
                Add more links on your profile to get more sign-off options →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
