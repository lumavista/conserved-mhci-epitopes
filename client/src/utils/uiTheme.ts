export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mhc-demo-app-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyStoredTheme(): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", getStoredTheme());
  }
}
