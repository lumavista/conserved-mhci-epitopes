import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className}`}
      style={{ boxShadow: "var(--shadow-hairline)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text)] ${className}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-sm text-[var(--color-text)] ${className}`}>{children}</div>;
}
