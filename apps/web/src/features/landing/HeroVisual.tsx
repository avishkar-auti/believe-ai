/**
 * The hero's product visual: a stylised campaign-performance panel with
 * floating stat cards, built from CSS + inline SVG so it's crisp at any size,
 * themeable, and adds no asset weight.
 */
export function HeroVisual() {
  const bars = [38, 52, 44, 68, 58, 82, 74, 96];

  return (
    <div className="relative mx-auto w-full max-w-3xl" aria-hidden="true">
      {/* Floating stat — top left */}
      <div className="absolute -left-2 top-8 z-20 rounded-2xl bg-white px-4 py-3 shadow-lift sm:-left-8 dark:bg-ink-800">
        <p className="text-[11px] text-ink-400">Reply rate</p>
        <p className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">14.2%</p>
        <span className="mt-1 inline-flex items-center rounded-pill bg-lime-500/15 px-1.5 py-0.5 text-[10px] font-medium text-lime-600">
          ▲ 3.1%
        </span>
      </div>

      {/* Floating stat — bottom right */}
      <div className="absolute -right-2 bottom-10 z-20 rounded-2xl bg-white px-4 py-3 shadow-lift sm:-right-6 dark:bg-ink-800">
        <p className="text-[11px] text-ink-400">Emails sent</p>
        <p className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">12,480</p>
        <div className="mt-2 flex items-end gap-0.5">
          {[6, 10, 8, 14, 11, 16].map((h, i) => (
            <span key={i} className="w-1 rounded-sm bg-brand-500/70" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="relative z-10 overflow-hidden rounded-panel border border-white/60 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-800">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4 dark:border-ink-700">
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Campaign performance</p>
            <p className="text-xs text-ink-400">Last 30 days</p>
          </div>
          <span className="rounded-pill bg-lime-500/15 px-2.5 py-1 text-xs font-medium text-lime-600">Running</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 dark:divide-ink-700 dark:border-ink-700">
          {[
            { label: "Opened", value: "62%" },
            { label: "Clicked", value: "28%" },
            { label: "Replied", value: "14%" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4">
              <p className="text-[11px] text-ink-400">{s.label}</p>
              <p className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bars + trend line */}
        <div className="relative px-6 pb-6 pt-8">
          <div className="flex h-32 items-end justify-between gap-2 sm:gap-3">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-lime-500/25 to-lime-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <svg
            viewBox="0 0 320 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-6 bottom-6 h-32 w-[calc(100%-3rem)]"
          >
            <path
              d="M0 78 C 40 70, 70 58, 105 62 S 170 34, 205 30 S 275 12, 320 6"
              fill="none"
              stroke="#4353FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
