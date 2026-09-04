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
        className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-sm font-medium text-fg-muted transition-colors duration-150 hover:border-line-strong"
      >
        <CalendarRange className="h-4 w-4 text-fg-subtle" />
        {formatRange(value.from, value.to)}
        <ChevronDown className={cn("h-3.5 w-3.5 text-fg-subtle transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 flex w-[19rem] gap-3 rounded-card border border-line bg-surface p-3 shadow-lift sm:w-[26rem]">
          <div className="hidden w-32 shrink-0 flex-col gap-1 border-r border-line pr-3 sm:flex">
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
                className="rounded-control px-2.5 py-2 text-left text-xs font-medium text-fg-muted transition-colors duration-150 hover:bg-accent-soft hover:text-accent"
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
                className="rounded-control p-1.5 text-fg-muted transition-colors hover:bg-fg/[0.06]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-fg">
                {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="rounded-control p-1.5 text-fg-muted transition-colors hover:bg-fg/[0.06]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAY_LABELS.map((w) => (
                <span key={w} className="text-[11px] font-medium text-fg-subtle">
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
                      "flex h-8 w-8 items-center justify-center justify-self-center rounded-full text-xs transition-colors duration-150",
                      !inMonth && "text-fg-subtle/50",
                      inMonth && !inRange && "text-fg-muted hover:bg-fg/[0.06]",
                      inRange && !isEdge && "rounded-none bg-accent-soft text-accent",
                      isEdge && "bg-accent font-semibold text-accent-fg hover:bg-accent-hover",
                      isToday && !isEdge && "ring-1 ring-inset ring-accent/40",
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
