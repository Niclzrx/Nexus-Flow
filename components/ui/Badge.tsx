import type { ReactNode } from "react";

interface BadgeProps {
  tone?: "success" | "error" | "ember" | "signal" | "muted";
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  success: "bg-success/15 text-success",
  error: "bg-error/15 text-error",
  ember: "bg-ember/15 text-ember",
  signal: "bg-signal/15 text-signal",
  muted: "bg-surface-elevated text-text-muted",
};

export function Badge({ tone = "muted", children }: BadgeProps) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
