import { type ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "error";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<CalloutVariant, { border: string; bg: string; text: string }> = {
  info: {
    border: "color-mix(in srgb, var(--color-secondary-cyan) 50%, var(--color-border))",
    bg: "color-mix(in srgb, var(--color-secondary-cyan) 6%, transparent)",
    text: "var(--color-text)",
  },
  warning: {
    border: "color-mix(in srgb, var(--color-warning) 55%, var(--color-border))",
    bg: "color-mix(in srgb, var(--color-warning) 6%, transparent)",
    text: "var(--color-text)",
  },
  error: {
    border: "color-mix(in srgb, var(--color-critical) 55%, var(--color-border))",
    bg: "color-mix(in srgb, var(--color-critical) 6%, transparent)",
    text: "var(--color-text)",
  },
};

export function Callout({ variant = "warning", title, children, className = "" }: CalloutProps) {
  const style = variantStyles[variant];
  return (
    <div
      className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${className}`}
      style={{
        borderColor: style.border,
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {title && <strong className="block mb-1">{title}</strong>}
      {children}
    </div>
  );
}
