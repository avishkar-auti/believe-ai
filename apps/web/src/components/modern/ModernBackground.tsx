/**
 * The atmospheric canvas behind every Modern page. Two very faint accent
 * pools plus a fine noise wash — enough that surfaces read as *lit* rather
 * than floating on flat black, without any moving background.
 *
 * Static by design: no animation loop, no canvas, nothing to throttle.
 */
export function ModernBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 8%, rgb(var(--accent) / 0.10), transparent 38%)," +
            "radial-gradient(circle at 12% 88%, rgb(var(--informative) / 0.06), transparent 34%)",
          opacity: "var(--ambient-opacity)",
        }}
      />
      {/* Fractal noise, inlined as a data URI so it costs no request. Kept
          very low opacity — it exists to kill gradient banding on large dark
          areas, not to be seen. */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay dark:opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
