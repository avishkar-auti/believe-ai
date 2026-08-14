import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../../app/providers/ThemeProvider.js";
import { cn } from "../../lib/cn.js";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/**
 * Three-way segmented control rather than a binary toggle — "system" has to
 * be a first-class choice, not an implicit default the user can't get back to.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5 dark:border-ink-700"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              "rounded-md p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
