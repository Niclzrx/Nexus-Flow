"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";
import { fmt } from "@/lib/format";
import { EVOLUCAO_SALDO_MOCK } from "@/lib/mock-data";

export function SaldoEvolutionChart() {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={EVOLUCAO_SALDO_MOCK} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="nxArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-muted)" }}
            formatter={(v: number) => fmt(v)}
          />
          <Area type="monotone" dataKey="saldo" stroke="var(--signal)" fill="url(#nxArea)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GastosPorCategoriaChart({ data }: { data: { categoria: string; valor: number }[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="categoria" type="category" width={90} tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-muted)" }}
            formatter={(v: number) => fmt(v)}
          />
          <Bar dataKey="valor" fill="var(--signal)" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
