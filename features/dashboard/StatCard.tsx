import type { LucideIcon } from "lucide-react";
import { fmt } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: number;
  tone?: "success" | "error" | "default";
  icon?: LucideIcon;
}

export function StatCard({ label, value, tone = "default", icon: Icon }: StatCardProps) {
  const color = tone === "success" ? "var(--success)" : tone === "error" ? "var(--error)" : "var(--text)";
  return (
    <div className="rounded-lg p-4 bg-surface border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-xs font-medium text-text-faint">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-text-faint" />}
      </div>
      <span className="font-mono text-xl font-semibold" style={{ color }}>{fmt(value)}</span>
    </div>
  );
}
