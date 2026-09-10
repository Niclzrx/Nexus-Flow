"use client";

import { useState } from "react";
import { ArrowDownLeft, Waves } from "lucide-react";
import { fmt } from "@/lib/format";

interface FlowViewProps {
  entradas: number;
  gastos: number;
  metas: number;
  disponivel: number;
}

export function FlowView({ entradas, gastos, metas, disponivel }: FlowViewProps) {
  const [visible, setVisible] = useState(false);
  const total = entradas || 1;
  const segs = [
    { label: "Gastos", value: gastos, color: "var(--error)" },
    { label: "Metas", value: metas, color: "var(--ember)" },
    { label: "Disponível", value: Math.max(0, disponivel), color: "var(--success)" },
  ];

  return (
    <div>
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium mb-3 text-text-muted"
      >
        <Waves className="h-3.5 w-3.5" />
        {visible ? "Ocultar Flow View" : "Mostrar Flow View"}
      </button>

      {visible && (
        <div className="rounded-lg p-4 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-sm font-medium text-text">Flow View</span>
            <span className="text-xs text-text-faint">de onde veio, para onde foi</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="h-9 w-9 rounded-full flex items-center justify-center bg-signal/15 text-signal">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <span className="font-mono text-[11px] text-text-faint">{fmt(entradas)}</span>
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-surface-elevated">
              {segs.map((s) => (
                <div key={s.label} style={{ width: `${Math.max(0, (s.value / total) * 100)}%`, background: s.color, transition: "width 700ms cubic-bezier(0.16,1,0.3,1)" }} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {segs.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-text-muted">{s.label}</span>
                <span className="font-mono text-xs text-text-faint">{fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
