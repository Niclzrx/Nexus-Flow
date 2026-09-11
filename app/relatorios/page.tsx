"use client";

import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { SaldoEvolutionChart, GastosPorCategoriaChart } from "@/features/reports/ReportCharts";
import { ExportButton } from "@/features/export/ExportButton";
import { fmt } from "@/lib/format";

const CATEGORIA_METAS = "Metas";

export default function RelatoriosPage() {
  const { transactions, loading } = useTransactions();

  // Movimentações da categoria "Metas" são transferências internas (ver
  // app/metas/page.tsx) — entram no saldo, mas ficam de fora das
  // estatísticas de gasto/renda "de verdade" pra não distorcer os números.
  const gastosReaisTx = useMemo(() => transactions.filter((t) => t.tipo === "gasto" && t.categoria !== CATEGORIA_METAS), [transactions]);
  const entradasReaisTx = useMemo(() => transactions.filter((t) => t.tipo === "entrada" && t.categoria !== CATEGORIA_METAS), [transactions]);

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    gastosReaisTx.forEach((t) => {
      map[t.categoria] = (map[t.categoria] ?? 0) + t.valor;
    });
    return Object.entries(map).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
  }, [gastosReaisTx]);

  const entradas = entradasReaisTx.reduce((a, t) => a + t.valor, 0);
  const gastos = gastosReaisTx.reduce((a, t) => a + t.valor, 0);
  const maiorGasto = [...gastosReaisTx].sort((a, b) => b.valor - a.valor)[0];
  const categoriaTop = porCategoria[0];

  const enviadoParaMetas = useMemo(
    () => transactions.filter((t) => t.tipo === "gasto" && t.categoria === CATEGORIA_METAS).reduce((a, t) => a + t.valor, 0)
      - transactions.filter((t) => t.tipo === "entrada" && t.categoria === CATEGORIA_METAS).reduce((a, t) => a + t.valor, 0),
    [transactions]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-text">Relatórios</span>
        <ExportButton />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          <div className="h-64 rounded-lg bg-surface border border-border" />
          <div className="h-64 rounded-lg bg-surface border border-border" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-surface border border-border">
              <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">Evolução do saldo</span>
              <div className="mt-3"><SaldoEvolutionChart /></div>
            </div>
            <div className="rounded-lg p-4 bg-surface border border-border">
              <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">Gastos por categoria</span>
              <div className="mt-3"><GastosPorCategoriaChart data={porCategoria} /></div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MiniStat label="Entradas x Gastos" value={`${fmt(entradas)} / ${fmt(gastos)}`} />
            <MiniStat label="Maior gasto" value={maiorGasto ? `${maiorGasto.descricao} · ${fmt(maiorGasto.valor)}` : "—"} />
            <MiniStat label="Categoria que mais consumiu" value={categoriaTop ? `${categoriaTop.categoria} · ${fmt(categoriaTop.valor)}` : "—"} />
            <MiniStat label="Média mensal de gastos" value={fmt(gastos)} />
            <MiniStat label="Enviado para metas" value={fmt(enviadoParaMetas)} />
          </div>
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
