"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  pct: number;
  tone?: "signal" | "ember" | "error";
  animateKey?: string;
}

const TONE_VAR: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  signal: "var(--signal)",
  ember: "var(--ember)",
  error: "var(--error)",
};

export function ProgressBar({ pct, tone = "signal", animateKey }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth(pct), 60);
    return () => clearTimeout(timeout);
  }, [pct, animateKey]);

  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden border border-border bg-surface-elevated">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, width)}%`, background: TONE_VAR[tone], transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      />
    </div>
  );
}
