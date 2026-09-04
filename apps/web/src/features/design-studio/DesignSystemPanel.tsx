import { motion } from "framer-motion";
import { X } from "lucide-react";

const COLORS = [
  { name: "Accent", token: "var(--accent)" },
  { name: "Background", token: "var(--bg)" },
  { name: "Surface", token: "var(--surface-3)" },
  { name: "Success", token: "var(--success)" },
  { name: "Warning", token: "var(--warning)" },
  { name: "Danger", token: "var(--danger)" },
];

const TYPE = [
  { label: "Display", className: "text-2xl font-semibold tracking-tight" },
  { label: "Heading", className: "text-base font-semibold" },
  { label: "Body", className: "text-sm" },
  { label: "Caption", className: "text-[11px] text-fg-subtle" },
];

const RADII = [4, 8, 12, 16];

/** A read-only view of the tokens the renderer and studio chrome actually use.
 * Nothing here is editable, because the generation prompt has no token input —
 * showing sliders that changed nothing would be a fake feature. */
export function DesignSystemPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="absolute right-3 top-3 bottom-28 z-20 flex w-[300px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface-3/90 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <span className="text-xs font-semibold text-fg">Design system</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close design system panel"
          className="flex h-6 w-6 items-center justify-center rounded-pill text-fg-subtle transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-3.5">
        <Section title="Colors">
          <div className="space-y-1.5">
            {COLORS.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: c.token }} />
                <span className="text-xs text-fg-muted">{c.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-2">
            {TYPE.map((t) => (
              <div key={t.label} className="flex items-baseline justify-between gap-3">
                <span className={t.className}>Aa</span>
                <span className="text-[11px] text-fg-subtle">{t.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius">
          <div className="flex items-end gap-2">
            {RADII.map((r) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <span className="h-9 w-9 border border-line bg-surface-4" style={{ borderRadius: r }} />
                <span className="text-[10px] text-fg-subtle">{r}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion">
          <ul className="space-y-1 text-[11px] text-fg-muted">
            <li>Hover · 150ms</li>
            <li>Panels · 200ms</li>
            <li>Canvas objects · 200ms</li>
            <li>Arrange · 250ms</li>
            <li>Easing · cubic-bezier(0.2, 0, 0, 1)</li>
          </ul>
        </Section>

        <p className="text-[10px] leading-relaxed text-fg-subtle">
          These tokens follow your Believe.ai appearance mode (Light, Dark, System, Liquid UI). Generated screens carry
          their own styling from the design engine.
        </p>
      </div>
    </motion.aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{title}</p>
      {children}
    </section>
  );
}
