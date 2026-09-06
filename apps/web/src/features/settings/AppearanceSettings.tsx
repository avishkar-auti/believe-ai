import { Moon, Sparkles, Sun } from "lucide-react";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { useTheme, type AppearanceChoice } from "../../app/providers/ThemeProvider.js";
import { cn } from "../../lib/cn.js";

const CHOICES: { value: AppearanceChoice; label: string; description: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", description: "Clean and minimal for everyday use.", Icon: Sun },
  { value: "dark", label: "Dark", description: "Easy on the eyes in low light.", Icon: Moon },
  {
    value: "modern",
    label: "Modern",
    description: "Transforms layout, surfaces, motion and component style.",
    Icon: Sparkles,
  },
];

/** A miniature of the real thing — a card, a couple of surfaces and an
 * accent, drawn from the same tokens each choice actually applies. */
function ChoicePreview({ value }: { value: AppearanceChoice }) {
  const palette =
    value === "light"
      ? { bg: "#f6f5fa", surface: "#ffffff", line: "#e4e1f0", accent: "#7c3aed", text: "#17141f" }
      : value === "dark"
        ? { bg: "#12101a", surface: "#1a1724", line: "#302b42", accent: "#a78bfa", text: "#edebf5" }
        : { bg: "#080a10", surface: "#13151c", line: "#1c1e24", accent: "#705cff", text: "#f5f6f8" };

  return (
    <div className="flex h-16 gap-1.5 overflow-hidden rounded-lg p-2" style={{ backgroundColor: palette.bg }}>
      <div className="w-1/4 rounded" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.line}` }} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-2 w-3/5 rounded-full" style={{ backgroundColor: palette.text, opacity: 0.75 }} />
        <div className="flex-1 rounded" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.line}` }} />
        <div className="h-2 w-1/3 rounded-full" style={{ backgroundColor: palette.accent }} />
      </div>
    </div>
  );
}

export function AppearanceSettings() {
  const { choice, setChoice, colorScheme, setColorScheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-fg">Appearance</h2>
        <p className="mt-0.5 text-caption text-fg-muted">Choose the look and feel that matches your style.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHOICES.map(({ value, label, description, Icon }) => {
            const active = choice === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChoice(value)}
                className={cn(
                  "rounded-card border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong",
                )}
              >
                <ChoicePreview value={value} />
                <p className={cn("mt-2.5 flex items-center gap-1.5 text-label font-medium", active ? "text-accent" : "text-fg")}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </p>
                <p className="mt-0.5 text-caption leading-snug text-fg-muted">{description}</p>
              </button>
            );
          })}
        </div>

        {choice === "modern" && (
          <>
            <div>
              <p className="mb-1.5 text-label text-fg-muted">Modern appearance</p>
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-line p-0.5">
                {(["light", "dark"] as const).map((scheme) => {
                  const active = colorScheme === scheme;
                  const Icon = scheme === "light" ? Sun : Moon;
                  return (
                    <button
                      key={scheme}
                      type="button"
                      onClick={() => setColorScheme(scheme)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-medium capitalize transition-colors",
                        active ? "bg-accent-soft text-accent" : "text-fg-subtle hover:text-fg-muted",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {scheme}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="flex gap-2 rounded-card border border-accent/20 bg-accent/[0.06] p-3 text-caption leading-relaxed text-fg-muted">
              <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
              Modern gives you a refined, premium experience with enhanced visuals, smooth motion and a more immersive interface.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
