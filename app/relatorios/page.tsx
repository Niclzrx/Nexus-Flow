"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  SaldoEvolutionChart,
  GastosPorCategoriaChart,
  TendenciaChart,
  ComparativoChart,
} from "@/features/reports/ReportCharts";
import { ReportInsights } from "@/features/reports/ReportInsights";
import { ExportButton } from "@/features/export/ExportButton";
import {
  fmt,
  filterByPeriod,
  filterByPreviousPeriod,
  groupByDay,
  groupByWeek,
  groupByMonth,
  type ReportPeriod,
} from "@/lib/format";
import type { Transaction } from "@/types";

const CATEGORIA_METAS = "Metas";

const PERIODOS: { key: ReportPeriod; label: string }[] = [
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
  { key: "anual", label: "Anual" },
];

export default function RelatoriosPage() {
  const { transactions, loading } = useTransactions();
  const [periodo, setPeriodo] = useState<ReportPeriod>("mensal");

  const atual = useMemo(() => filterByPeriod(transactions, periodo), [transactions, periodo]);
  const anterior = useMemo(() => filterByPreviousPeriod(transactions, periodo), [transactions, periodo]);

  const gastosNow = useMemo(() => atual.filter((t) => t.tipo === "gasto" && t.categoria !== CATEGORIA_METAS), [atual]);
  const entradasNow = useMemo(() => atual.filter((t) => t.tipo === "entrada" && t.categoria !== CATEGORIA_METAS), [atual]);
  const gastosPrev = useMemo(() => anterior.filter((t) => t.tipo === "gasto" && t.categoria !== CATEGORIA_METAS), [anterior]);
  const entradasPrev = useMemo(() => anterior.filter((t) => t.tipo === "entrada" && t.categoria !== CATEGORIA_METAS), [anterior]);

  // Totais
  const totalEntradas = useMemo(() => entradasNow.reduce((a, t) => a + t.valor, 0), [entradasNow]);
  const totalGastos = useMemo(() => gastosNow.reduce((a, t) => a + t.valor, 0), [gastosNow]);
  const totalSaldo = totalEntradas - totalGastos;
  const totalEntradasPrev = useMemo(() => entradasPrev.reduce((a, t) => a + t.valor, 0), [entradasPrev]);
  const totalGastosPrev = useMemo(() => gastosPrev.reduce((a, t) => a + t.valor, 0), [gastosPrev]);
  const totalSaldoPrev = totalEntradasPrev - totalGastosPrev;

  // Variacao %
  const varEntradas = totalEntradasPrev > 0 ? ((totalEntradas - totalEntradasPrev) / totalEntradasPrev) * 100 : 0;
  const varGastos = totalGastosPrev > 0 ? ((totalGastos - totalGastosPrev) / totalGastosPrev) * 100 : 0;
  const varSaldo = totalSaldoPrev !== 0 ? ((totalSaldo - totalSaldoPrev) / Math.abs(totalSaldoPrev)) * 100 : 0;

  // Top categorias
  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    gastosNow.forEach((t) => { map[t.categoria] = (map[t.categoria] ?? 0) + t.valor; });
    return Object.entries(map).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
  }, [gastosNow]);

  const maiorGasto = useMemo(() => [...gastosNow].sort((a, b) => b.valor - a.valor)[0], [gastosNow]);

  // Tendencia
  const tendenciaData = useMemo(() => {
    if (periodo === "semanal") return groupByDay(gastosNow);
    if (periodo === "mensal") return groupByWeek(gastosNow);
    return groupByMonth(gastosNow);
  }, [gastosNow, periodo]);

  // Comparativo (gastos por sub-periodo)
  const comparativoAtual = useMemo(() => {
    if (periodo === "semanal") return groupByDay(gastosNow);
    if (periodo === "mensal") return groupByWeek(gastosNow);
    return groupByMonth(gastosNow);
  }, [gastosNow, periodo]);

  const comparativoAnterior = useMemo(() => {
    if (periodo === "semanal") return groupByDay(gastosPrev);
    if (periodo === "mensal") return groupByWeek(gastosPrev);
    return groupByMonth(gastosPrev);
  }, [gastosPrev, periodo]);

  const fmtVar = (v: number) => {
    const s = v > 0 ? "+" : "";
    return s + v.toFixed(0) + "%";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-text">Relatórios</span>
        <ExportButton />
      </div>

      {/* Seletor de período */}
      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`px-4 py-2 rounded-lg font-display text-sm font-medium transition-colors ${
              periodo === p.key
                ? "bg-signal text-white"
                : "bg-surface border border-border text-text-faint hover:text-text"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          <div className="h-64 rounded-lg bg-surface border border-border" />
          <div className="h-64 rounded-lg bg-surface border border-border" />
        </div>
      ) : (
        <>
          {/* Resumo do período */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg p-4 bg-surface border border-border">
              <div className="font-display text-xs font-medium mb-1 text-text-faint">Entradas</div>
              <div className="text-lg font-semibold text-text">{fmt(totalEntradas)}</div>
              <div className={`text-xs mt-0.5 ${varEntradas >= 0 ? "text-success" : "text-danger"}`}>
                {fmtVar(varEntradas)} vs anterior
              </div>
            </div>
            <div className="rounded-lg p-4 bg-surface border border-border">
              <div className="font-display text-xs font-medium mb-1 text-text-faint">Gastos</div>
              <div className="text-lg font-semibold text-text">{fmt(totalGastos)}</div>
              <div className={`text-xs mt-0.5 ${varGastos <= 0 ? "text-success" : "text-danger"}`}>
                {fmtVar(varGastos)} vs anterior
              </div>
            </div>
            <div className="rounded-lg p-4 bg-surface border border-border">
              <div className="font-display text-xs font-medium mb-1 text-text-faint">Saldo</div>
              <div className={`text-lg font-semibold ${totalSaldo >= 0 ? "text-success" : "text-danger"}`}>
                {fmt(totalSaldo)}
              </div>
              <div className={`text-xs mt-0.5 ${varSaldo >= 0 ? "text-success" : "text-danger"}`}>
                {fmtVar(varSaldo)} vs anterior
              </div>
            </div>
          </div>

          {/* Tendência */}
          <div className="rounded-lg p-4 bg-surface border border-border">
            <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">
              Tendência de gastos
            </span>
            <div className="mt-3">
              <TendenciaChart data={tendenciaData} />
            </div>
          </div>

          {/* Comparativo */}
          <div className="rounded-lg p-4 bg-surface border border-border">
            <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">
              Comparativo vs período anterior
            </span>
            <div className="mt-3">
              <ComparativoChart atual={comparativoAtual} anterior={comparativoAnterior} />
            </div>
          </div>

          {/* Top categorias */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-surface border border-border">
              <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">
                Gastos por categoria
              </span>
              <div className="mt-3">
                <GastosPorCategoriaChart data={porCategoria} />
              </div>
            </div>
            <div className="rounded-lg p-4 bg-surface border border-border space-y-3">
              <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">
                Ranking de categorias
              </span>
              {porCategoria.length === 0 && (
                <div className="text-sm text-text-faint">Sem gastos neste período</div>
              )}
              {porCategoria.map((cat, i) => (
                <div key={cat.categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-faint w-5">{i + 1}.</span>
                    <span className="text-sm text-text">{cat.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-signal"
                        style={{ width: (cat.valor / (porCategoria[0]?.valor ?? 1)) * 100 + "%" }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text w-20 text-right">{fmt(cat.valor)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maior gasto */}
          {maiorGasto && (
            <MiniStat
              label="Maior gasto do período"
              value={maiorGasto.descricao + " · " + fmt(maiorGasto.valor)}
            />
          )}

          {/* Insights */}
          <ReportInsights transactions={transactions} periodo={periodo} />
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-4 bg-surface border border-border">
      <div className="font-display text-xs font-medium mb-1 text-text-faint">{label}</div>
      <div className="text-sm font-medium text-text">{value}</div>
    </div>
  );
}
