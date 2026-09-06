import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Appearance is two orthogonal axes, not one list:
 *
 *   experience  — which presentation layer renders (shell, spacing, motion)
 *   colorScheme — light or dark, within whichever experience is active
 *
 * So "Modern Dark" and "Dark" are genuinely different things: the second is
 * the original layout in dark colours, the first is the redesigned shell.
 */
export type ExperienceMode = "classic" | "modern";
export type ColorScheme = "light" | "dark";

/** What the appearance picker offers. Modern owns its own light/dark
 * sub-choice, so it sits alongside the two classic schemes rather than
 * pretending to be a third colour. */
export type AppearanceChoice = "light" | "dark" | "modern";

/** Alias kept so existing `resolved`-based consumers (Monaco theme selection
 * in the note/code editors) keep working — colour is still colour. */
export type ResolvedTheme = ColorScheme;

const SCHEME_KEY = "believe-ai:theme";
const EXPERIENCE_KEY = "believe-ai:experience";
const LIQUID_STORAGE_KEY = "believe-ai:liquid";

interface ThemeContextValue {
  experience: ExperienceMode;
  colorScheme: ColorScheme;
  /** Alias of colorScheme — what is actually painted right now. */
  resolved: ColorScheme;
  /** The single value the three-way appearance picker binds to. */
  choice: AppearanceChoice;
  setChoice: (choice: AppearanceChoice) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  /** The pointer-following ambient highlight — on by default, off for anyone
   * who'd rather not have a background effect track their cursor. */
  liquid: boolean;
  setLiquid: (liquid: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Anyone still carrying the retired "system" preference is resolved once
 * against their OS setting rather than silently forced to light. */
function readStoredScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(SCHEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return systemScheme();
}

function readStoredExperience(): ExperienceMode {
  if (typeof window === "undefined") return "classic";
  return window.localStorage.getItem(EXPERIENCE_KEY) === "modern" ? "modern" : "classic";
}

function readStoredLiquid(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(LIQUID_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

/**
 * Keeps the `dark` class (every `dark:` utility in the app keys off it, in
 * both experiences) and adds the two data attributes the Modern token layer
 * selects on. Also sets color-scheme so native controls match.
 *
 * Mirrored by the pre-paint script in index.html — change both together.
 */
function applyAppearance(experience: ExperienceMode, scheme: ColorScheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", scheme === "dark");
  root.dataset.theme = scheme;
  root.dataset.experience = experience;
  root.style.colorScheme = scheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [experience, setExperienceState] = useState<ExperienceMode>(readStoredExperience);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(readStoredScheme);
  const [liquid, setLiquidState] = useState<boolean>(readStoredLiquid);

  useEffect(() => {
    applyAppearance(experience, colorScheme);
  }, [experience, colorScheme]);

  const setColorScheme = useCallback((next: ColorScheme) => {
    setColorSchemeState(next);
    window.localStorage.setItem(SCHEME_KEY, next);
  }, []);

  const setChoice = useCallback((next: AppearanceChoice) => {
    const nextExperience: ExperienceMode = next === "modern" ? "modern" : "classic";
    setExperienceState(nextExperience);
    window.localStorage.setItem(EXPERIENCE_KEY, nextExperience);
    // Picking Light/Dark also sets the colour axis; picking Modern keeps
    // whichever scheme the user is already in.
    if (next !== "modern") {
      setColorSchemeState(next);
      window.localStorage.setItem(SCHEME_KEY, next);
    }
  }, []);

  const setLiquid = useCallback((next: boolean) => {
    setLiquidState(next);
    window.localStorage.setItem(LIQUID_STORAGE_KEY, String(next));
  }, []);

  const choice: AppearanceChoice = experience === "modern" ? "modern" : colorScheme;

  const value = useMemo(
    () => ({
      experience,
      colorScheme,
      resolved: colorScheme,
      choice,
      setChoice,
      setColorScheme,
      liquid,
      setLiquid,
    }),
    [experience, colorScheme, choice, setChoice, setColorScheme, liquid, setLiquid],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
