import type { ReactNode } from "react";
import { Button, Switch } from "../ui";

interface LayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  onHelpClick?: () => void;
  onThemeToggle?: () => void;
  theme?: "light" | "dark";
}

export function Layout({
  leftPanel,
  rightPanel,
  onHelpClick,
  onThemeToggle,
  theme = "light",
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] font-sans text-[var(--color-text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)] rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2"
      >
        Skip to content
      </a>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-chrome)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/icon.svg" alt="" className="h-10 w-10 shrink-0 object-contain" />
          <h1
            className="min-w-0 truncate text-xl font-semibold leading-tight tracking-tight text-[var(--color-accent)] sm:text-[22px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Conserved Human MHC-I Epitopes
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onThemeToggle && (
            <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)]">
                {theme === "dark" ? (
                  <>
                    <span className="text-[#3b82f6]" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </span>
                    Dark Mode
                  </>
                ) : (
                  <>
                    <span className="text-[#f97316]" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    </span>
                    Light Mode
                  </>
                )}
              </span>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) => {
                  if ((checked && theme !== "dark") || (!checked && theme !== "light")) {
                    onThemeToggle();
                  }
                }}
                aria-label="Toggle light or dark mode"
              />
            </div>
          )}
          {onHelpClick && (
            <Button variant="ghost" onClick={onHelpClick} aria-label="Help">
              ?
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-chrome)] p-4 lg:w-[420px] lg:max-w-[420px] lg:border-b-0 lg:border-r lg:border-[color:var(--color-border)]/70">
          {leftPanel}
        </aside>
        <main id="main" className="min-h-0 flex-1 overflow-auto bg-[var(--color-main-bg)] p-4">
          {rightPanel}
        </main>
      </div>
    </div>
  );
}
