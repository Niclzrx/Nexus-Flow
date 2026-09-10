import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fmt } from "@/lib/format";
import type { Goal } from "@/types";

export function GoalCard({ goal, verMetaHref }: { goal: Goal; verMetaHref?: string }) {
  const pct = Math.min(100, Math.round((goal.valor_guardado / goal.valor_meta) * 100));
  const falta = Math.max(0, goal.valor_meta - goal.valor_guardado);

  return (
    <div className="rounded-lg p-4 shrink-0 w-56 bg-surface border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-sm font-medium text-text">Meta: {goal.nome}</span>
        <span className="font-mono text-xs text-text-faint">{fmt(goal.valor_meta)}</span>
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-text-faint">Guardado</span>
        <span className="font-mono text-sm text-success">{fmt(goal.valor_guardado)}</span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-text-faint">Falta</span>
        <span className="font-mono text-sm text-text-muted">{fmt(falta)}</span>
      </div>
      <ProgressBar pct={pct} animateKey={goal.id} />
      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-[11px] text-text-faint">{pct}%</span>
        {verMetaHref && (
          <Link href={verMetaHref} className="text-xs font-medium text-signal">Ver meta</Link>
        )}
      </div>
    </div>
  );
}
