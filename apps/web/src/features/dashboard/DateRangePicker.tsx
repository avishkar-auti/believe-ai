import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn.js";
import {
  type DateRange,
  RANGE_PRESETS,
  buildMonthGrid,
  formatRange,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "./dateRange.js";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Self-contained calendar popover — no date-picker dependency, matches the
 * rest of the app's hand-rolled dropdown pattern (see NotificationBell). */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value.from));
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPendingFrom(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function pickDay(day: Date) {
    if (!pendingFrom) {
      setPendingFrom(day);
      return;
    }
    const from = day < pendingFrom ? day : pendingFrom;
    const to = day < pendingFrom ? pendingFrom : day;
    onChange({ from, to });
    setPendingFrom(null);
    setOpen(false);
  }

  const rangeStart = pendingFrom ?? value.from;
  const rangeEnd = pendingFrom ?? value.to;
  const grid = buildMonthGrid(viewMonth);
  const today = startOfDay(new Date());

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-pill border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
      >
        <CalendarRange className="h-4 w-4 text-ink-400" />
        {formatRange(value.from, value.to)}
        <ChevronDown className={cn("h-3.5 w-3.5 text-ink-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 flex w-[19rem] gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-lg dark:border-ink-700 dark:bg-ink-800 sm:w-[26rem]">
          <div className="hidden w-32 shrink-0 flex-col gap-1 border-r border-ink-100 pr-3 dark:border-ink-700 sm:flex">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const next = preset.range(today);
                  onChange(next);
                  setViewMonth(startOfMonth(next.to));
                  setPendingFrom(null);
                  setOpen(false);
                }}
                className="rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink-600 transition-colors duration-150 hover:bg-brand-500/10 hover:text-brand-600 dark:text-ink-300 dark:hover:bg-brand-400/10 dark:hover:text-brand-300"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-ink-900 dark:text-white">
                {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAY_LABELS.map((w) => (
                <span key={w} className="text-[11px] font-medium text-ink-400">
                  {w}
                </span>
              ))}
              {grid.map((day) => {
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const inRange = day >= rangeStart && day <= rangeEnd;
                const isEdge = isSameDay(day, rangeStart) || isSameDay(day, rangeEnd);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center justify-self-center rounded-full text-xs transition-all duration-150",
                      !inMonth && "text-ink-300 dark:text-ink-600",
                      inMonth && !inRange && "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-700",
                      inRange && !isEdge && "rounded-none bg-brand-500/10 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200",
                      isEdge && "bg-brand-500 font-semibold text-white hover:bg-brand-600",
                      isToday && !isEdge && "ring-1 ring-inset ring-brand-300",
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
