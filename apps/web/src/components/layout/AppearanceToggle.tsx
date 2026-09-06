import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme, type AppearanceChoice } from "../../app/providers/ThemeProvider.js";
import { cn } from "../../lib/cn.js";

const OPTIONS: { value: AppearanceChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "modern", label: "Modern", Icon: Sparkles },
];

/**
 * Three-way appearance picker. "Modern" sits alongside Light and Dark
 * because that's how the choice reads to a user, even though internally it
 * flips the experience axis rather than the colour one — so Modern brings
 * its own light/dark switch along beside it.
 */
export function AppearanceToggle() {
  const { choice, setChoice, colorScheme, setColorScheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="Appearance" className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = choice === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              title={label}
              onClick={() => setChoice(value)}
              className={cn(
                "rounded-md p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                active ? "bg-accent-soft text-accent" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Modern's colour axis is independent of the experience, so it needs
          its own switch — otherwise picking Modern would strand you in
          whichever scheme you happened to be in. */}
      {choice === "modern" && (
        <button
          type="button"
          onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
          aria-label={colorScheme === "dark" ? "Switch Modern to light" : "Switch Modern to dark"}
          title={colorScheme === "dark" ? "Modern dark" : "Modern light"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-fg-subtle transition-colors hover:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {colorScheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
