import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-signal text-white hover:bg-signal/90",
  secondary: "bg-surface-elevated text-text border border-border hover:border-border-strong",
  ghost: "bg-transparent text-text-muted hover:bg-surface-elevated hover:text-text",
  danger: "bg-error/10 text-error border border-error/30 hover:bg-error/20",
};

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
