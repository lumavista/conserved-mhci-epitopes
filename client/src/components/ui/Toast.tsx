import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  detail?: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, detail?: string) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, detail?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, detail }]);
    if (type !== "loading") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  );
}

function ToastList() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, removeToast } = ctx;
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex min-w-[280px] max-w-md items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm shadow-lg"
          role="alert"
        >
          <ToastIcon type={t.type} />
          <div className="flex-1">
            <p className="font-medium text-[var(--color-text)]">{t.message}</p>
            {t.detail && <p className="mt-0.5 text-[var(--color-text-muted)]">{t.detail}</p>}
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "loading") {
    return (
      <span
        className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
    );
  }
  const colors: Record<ToastType, string> = {
    success: "var(--color-success)",
    error: "var(--color-critical)",
    info: "var(--color-accent)",
    loading: "var(--color-accent)",
  };
  const ch = type === "success" ? "✓" : type === "error" ? "!" : "i";
  return (
    <span
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: `${colors[type]}20`, color: colors[type] }}
    >
      {ch}
    </span>
  );
}

export function useToast(): Pick<ToastContextValue, "addToast" | "removeToast"> {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return { addToast: ctx.addToast, removeToast: ctx.removeToast };
}
