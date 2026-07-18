import { KEYS, readJSON, writeJSON } from "./storage";

export type Theme = "light" | "dark" | "system";
export type AutoClear = "never" | "1min" | "5min" | "10min";

export interface Settings {
  theme: Theme;
  animations: boolean;
  defaultPasswordLength: number;
  defaultPassphraseWords: number;
  autoClear: AutoClear;
  showPrivacyReminders: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  animations: true,
  defaultPasswordLength: 16,
  defaultPassphraseWords: 4,
  autoClear: "never",
  showPrivacyReminders: true,
};

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(s: Settings) {
  writeJSON(KEYS.settings, s);
  applyTheme(s.theme);
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function autoClearMs(v: AutoClear): number | null {
  switch (v) {
    case "1min": return 60_000;
    case "5min": return 5 * 60_000;
    case "10min": return 10 * 60_000;
    default: return null;
  }
}