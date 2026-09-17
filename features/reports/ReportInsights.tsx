"use client";

import { useMemo } from "react";
import type { Transaction } from "@/types";
import type { ReportPeriod } from "@/lib/format";
import { filterByPeriod, filterByPreviousPeriod, fmt } from "@/lib/format";

const CATEGORIA_METAS = "Metas";

interface Insight {
  icon: string;
  text: string;
  type: "positive" | "warning" | "neutral";
}

function variacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
}

function fmtPct(v: number): string {
  const s = v > 0 ? "+" : "";
  return s + v.toFixed(0) + "%";
}

export function ReportInsights({
  transactions,
  periodo,
}: {
  transactions: Transaction[];
  periodo: ReportPeriod;
}) {
  const insights = useMemo<Insight[]>(() => {
    const atual = filterByPeriod(transactions, periodo);
    const anterior = filterByPreviousPeriod(transactions, periodo);

    const gastosNow = atual.filter((t) => t.tipo === "gasto" && t.categoria !== CATEGORIA_METAS);
    const gastosPrev = anterior.filter((t) => t.tipo === "gasto" && t.categoria !== CATEGORIA_METAS);

    const entradasNow = atual.filter((t) => t.tipo === "entrada" && t.categoria !== CATEGORIA_METAS);
    const entradasPrev = anterior.filter((t) => t.tipo === "entrada" && t.categoria !== CATEGORIA_METAS);

    const totalGastosNow = gastosNow.reduce((a, t) => a + t.valor, 0);
    const totalGastosPrev = gastosPrev.reduce((a, t) => a + t.valor, 0);
    const totalEntradasNow = entradasNow.reduce((a, t) => a + t.valor, 0);
    const totalEntradasPrev = entradasPrev.reduce((a, t) => a + t.valor, 0);

    const metasNow = atual.filter((t) => t.categoria === CATEGORIA_METAS);
    const enviadoMetas = metasNow.filter((t) => t.tipo === "gasto").reduce((a, t) => a + t.valor, 0);

    const result: Insight[] = [];

    // Variacao gastos
    if (totalGastosPrev > 0) {
      const v = variacao(totalGastosNow, totalGastosPrev);
      if (v < -5) {
        result.push({ icon: "✅", text: "Seus gastos caíram " + fmtPct(v) + " em relação ao período anterior. Continue assim!", type: "positive" });
      } else if (v > 20) {
        result.push({ icon: "⚠️", text: "Seus gastos aumentaram " + fmtPct(v) + " em relação ao período anterior. Fique atento!", type: "warning" });
      }
    }

    // Variacao entradas
    if (totalEntradasPrev > 0) {
      const v = variacao(totalEntradasNow, totalEntradasPrev);
      if (v > 5) {
        result.push({ icon: "📈", text: "Suas entradas cresceram " + fmtPct(v) + ". Boa evolução!", type: "positive" });
      } else if (v < -10) {
        result.push({ icon: "📉", text: "Suas entradas caíram " + fmtPct(v) + " em relação ao período anterior.", type: "warning" });
      }
    }

    // Top categoria
    const catMap: Record<string, number> = {};
    gastosNow.forEach((t) => { catMap[t.categoria] = (catMap[t.categoria] ?? 0) + t.valor; });
    const catEntries = Object.entries(catMap).sort(([, a], [, b]) => b - a);
    if (catEntries.length > 0 && totalGastosNow > 0) {
      const [cat, val] = catEntries[0];
      const pct = (val / totalGastosNow) * 100;
      if (pct > 40) {
        result.push({ icon: "⚠️", text: cat + " consumiu " + pct.toFixed(0) + "% dos seus gastos (" + fmt(val) + "). Considere diversificar.", type: "warning" });
      } else {
        result.push({ icon: "📊", text: "Top categoria: " + cat + " (" + fmt(val) + ", " + pct.toFixed(0) + "% dos gastos).", type: "neutral" });
      }
    }

    // Metas
    if (enviadoMetas > 0) {
      result.push({ icon: "💰", text: "Você enviou " + fmt(enviadoMetas) + " para metas neste período.", type: "positive" });
    }

    // Saldo
    const saldoNow = totalEntradasNow - totalGastosNow;
    const saldoPrev = totalEntradasPrev - totalGastosPrev;
    if (saldoNow > 0 && saldoPrev > 0) {
      const v = variacao(saldoNow, saldoPrev);
      if (v > 10) {
        result.push({ icon: "🎯", text: "Seu saldo cresceu " + fmtPct(v) + " em relação ao período anterior.", type: "positive" });
      }
    } else if (saldoNow < 0) {
      result.push({ icon: "🔴", text: "Este período fechou com saldo negativo (" + fmt(saldoNow) + ").", type: "warning" });
    }

    return result;
  }, [transactions, periodo]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-lg p-4 bg-surface border border-border space-y-2">
      <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">
        Insights do período
      </span>
      <ul className="space-y-1.5">
        {insights.map((ins, i) => (
          <li key={i} className="text-sm text-text flex items-start gap-2">
            <span>{ins.icon}</span>
            <span>{ins.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
