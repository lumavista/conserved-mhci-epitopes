import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white border border-transparent hover:bg-[var(--color-accent-hover)]",
  secondary:
    "bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-text-muted)]/10",
  ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-accent-muted)]",
  outline:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/50",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50 " +
        variantClasses[variant] +
        " " +
        className
      }
      style={{ fontFamily: "var(--font-sans)" }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
