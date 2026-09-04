import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/cn.js";
import { Z } from "../../lib/zIndex.js";
import { MOTION } from "../../lib/motion.js";

export interface MenuItemDef {
  id: string;
  label: string;
  icon?: typeof import("lucide-react").MoreHorizontal;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** The one dropdown-menu pattern in the product — a trigger that opens a
 * small anchored list of actions, closes on an outside click or Escape.
 * `align` picks which edge the menu hangs from relative to the trigger. */
export function Menu({
  trigger,
  items,
  align = "end",
  className,
}: {
  trigger: ReactNode;
  items: MenuItemDef[];
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className={cn("relative", className)}>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger}
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: MOTION.fast }}
            role="menu"
            className={cn(
              "absolute mt-1 w-48 overflow-hidden rounded-xl surface-3 surface-edge p-1 shadow-lift",
              Z.menu,
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-label transition-colors hover:bg-fg/[0.06] disabled:cursor-not-allowed disabled:opacity-40",
                  item.danger ? "text-critical" : "text-fg",
                )}
              >
                {item.icon && <item.icon className="h-3.5 w-3.5" />}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
