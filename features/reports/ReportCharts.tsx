"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
  Legend,
} from "recharts";
import { fmt } from "@/lib/format";

export function SaldoEvolutionChart({ data }: { data?: { mes: string; saldo: number }[] }) {
  const chartData = data && data.length > 0 ? data : [];
  if (chartData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-text-faint text-xs">Sem dados para exibir</div>;
  }
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-text-faint text-xs">Sem dados para exibir</div>;
  }
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

export function TendenciaChart({
  data,
  dataKey = "valor",
  label = "valor",
}: {
  data: { label: string; valor: number }[];
  dataKey?: string;
  label?: string;
}) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-text-faint text-xs">Sem dados para exibir</div>;
  }
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--text-faint)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-muted)" }}
            formatter={(v: number) => fmt(v)}
          />
          <Bar dataKey={dataKey} fill="var(--signal)" radius={[4, 4, 0, 0]} barSize={20} name={label} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparativoChart({
  atual,
  anterior,
}: {
  atual: { label: string; valor: number }[];
  anterior: { label: string; valor: number }[];
}) {
  const labels = new Set<string>();
  atual.forEach((d) => labels.add(d.label));
  anterior.forEach((d) => labels.add(d.label));
  const allLabels = Array.from(labels).sort();

  const mapAtual: Record<string, number> = {};
  atual.forEach((d) => { mapAtual[d.label] = d.valor; });
  const mapAnterior: Record<string, number> = {};
  anterior.forEach((d) => { mapAnterior[d.label] = d.valor; });

  const data = allLabels.map((l) => ({
    label: l,
    "Periodo anterior": mapAnterior[l] ?? 0,
    "Periodo atual": mapAtual[l] ?? 0,
  }));

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-text-faint text-xs">Sem dados para comparar</div>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--text-faint)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-muted)" }}
            formatter={(v: number) => fmt(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Periodo anterior" fill="var(--text-faint)" radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="Periodo atual" fill="var(--signal)" radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
