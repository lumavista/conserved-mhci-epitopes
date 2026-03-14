import type { ReactNode } from "react";
import { Button } from "../ui";
import { APP_NAME, APP_VERSION, APP_COPYRIGHT } from "../../utils/appMeta";

interface LayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  onExportClick?: () => void;
  exportDisabled?: boolean;
  exportLabel?: string;
  onReportClick?: () => void;
  reportDisabled?: boolean;
  reportLabel?: string;
  onHelpClick?: () => void;
  onThemeToggle?: () => void;
  theme?: "light" | "dark";
}

export function Layout({
  leftPanel,
  rightPanel,
  onExportClick,
  exportDisabled = false,
  exportLabel = "Download published",
  onReportClick,
  reportDisabled = false,
  reportLabel = "Download predicted",
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
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-chrome)] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-md bg-gradient-to-br from-[#255CF4] to-[#6366f1] flex items-center justify-center">
            <img src="/icon.svg" alt="" className="h-5 w-5 shrink-0" />
          </div>
          <h1
            className="min-w-0 truncate font-display text-xl sm:text-[22px] font-semibold leading-tight tracking-tight text-[var(--color-accent)]"
          >
            {APP_NAME}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onThemeToggle && (
            <Button
              variant="ghost"
              onClick={onThemeToggle}
              aria-label="Toggle light or dark mode"
              className="h-9 min-h-[40px] lg:h-8 rounded-full px-0"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-accent-muted)] border border-[var(--color-accent)] text-[11px] sm:text-xs font-medium text-[var(--color-accent)]">
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                <span className="hidden sm:inline">Theme</span>
              </span>
            </Button>
          )}
          {onHelpClick && (
            <Button
              variant="ghost"
              onClick={onHelpClick}
              aria-label="Help"
              className="h-9 min-h-[40px] lg:h-8 rounded-full px-0"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-accent-muted)] border border-[var(--color-accent)] text-[11px] sm:text-xs font-medium text-[var(--color-accent)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span className="hidden sm:inline">Help</span>
              </span>
            </Button>
          )}
          {onReportClick && (
            <Button
              variant="primary"
              onClick={onReportClick}
              disabled={reportDisabled}
            >
              {reportLabel}
            </Button>
          )}
          {onExportClick && (
            <Button
              variant="primary"
              onClick={onExportClick}
              disabled={exportDisabled}
            >
              {exportLabel}
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-chrome)] px-4 pt-4 pb-4 lg:w-[420px] lg:max-w-[420px] lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-[var(--color-border)]">
          <div className="flex flex-col">
            {leftPanel}
            <div className="h-10 shrink-0" aria-hidden />
          </div>
        </aside>
        <main
          id="main"
          className="min-h-0 flex-1 overflow-auto bg-[var(--color-main-bg)] px-5 py-5"
        >
          <div className="mx-auto max-w-5xl space-y-4">
            {rightPanel}
            <footer className="mt-4 border-t border-[var(--color-border)] pt-2 font-mono text-[10px] text-[var(--color-text-muted)]">
              {APP_NAME} · version {APP_VERSION} · {APP_COPYRIGHT}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
