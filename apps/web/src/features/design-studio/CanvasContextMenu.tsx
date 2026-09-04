import { motion } from "framer-motion";

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** Small floating menu used for both the pane and screen right-click menus. Only
 * actions with a real backend or canvas implementation are listed. */
export function CanvasContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  return (
    <>
      <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        className="fixed z-50 w-52 rounded-xl border border-line bg-surface-3/95 p-1.5 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
        style={{ left: x, top: y }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              item.danger
                ? "text-critical hover:bg-critical/10"
                : "text-fg-muted hover:bg-surface-4 hover:text-fg"
            }`}
          >
            {item.label}
          </button>
        ))}
      </motion.div>
    </>
  );
}
