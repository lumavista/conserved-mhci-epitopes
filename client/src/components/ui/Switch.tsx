import type { ButtonHTMLAttributes } from "react";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  "aria-label"?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  className = "",
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 " +
        (checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]") +
        " " +
        className
      }
      {...props}
    >
      <span
        className={
          "block h-5 w-5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-transform " +
          (checked ? "translate-x-6" : "translate-x-0.5")
        }
        aria-hidden
      />
    </button>
  );
}
