"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useFinance } from "@/lib/providers/FinanceProvider";
import { StatCard } from "@/features/dashboard/StatCard";
import { FlowView } from "@/features/dashboard/FlowView";
import { GoalCard } from "@/features/goals/GoalCard";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmt, todayISO } from "@/lib/format";
import type { Transaction } from "@/types";

const CATEGORIA_METAS = "Metas";

export default function OverviewPage() {
  const { transactions, loading, editTransaction, removeTransaction } = useTransactions();
  const { goals } = useGoals();
  const { profile } = useFinance();
  const [editing, setEditing] = useState<Transaction | null>(null);

  // "Metas" e uma categoria especial: guardar/resgatar dinheiro de uma meta
  // gera uma movimentacao real (ver app/metas/page.tsx), mas ela e uma
  // transferencia interna, nao gasto nem renda de verdade — por isso fica
  // separada nos cartoes e no Flow View, embora conte pro saldo igual.
  const totalEntradas = useMemo(() => transactions.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0), [transactions]);
  const totalGastos = useMemo(() => transactions.filter((t) => t.tipo === "gasto").reduce((a, t) => a + t.valor, 0), [transactions]);
  const metasContribuicoes = useMemo(() => transactions.filter((t) => t.tipo === "gasto" && t.categoria === CATEGORIA_METAS).reduce((a, t) => a + t.valor, 0), [transactions]);
  const metasResgates = useMemo(() => transactions.filter((t) => t.tipo === "entrada" && t.categoria === CATEGORIA_METAS).reduce((a, t) => a + t.valor, 0), [transactions]);

  const entradasReais = totalEntradas - metasResgates;
  const gastosReais = totalGastos - metasContribuicoes;
  const saldoInicial = profile?.saldo_inicial ?? 0;
  const saldo = saldoInicial + totalEntradas - totalGastos; // disponivel de verdade, ja reflete o que foi guardado

  const hoje = todayISO();
  const movsHoje = transactions.filter((t) => t.data === hoje);

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="rounded-lg p-6 bg-surface border border-border">
        <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">Saldo</span>
        <div className="font-display text-3xl font-bold tracking-tight mt-1 text-text">{fmt(saldo)}</div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatCard label="Entradas" value={entradasReais} tone="success" icon={ArrowDownLeft} />
          <StatCard label="Gastos" value={gastosReais} tone="error" icon={ArrowUpRight} />
          <StatCard label="Disponivel" value={saldo} icon={Wallet} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-semibold text-text">Metas</span>
          <Link href="/metas" className="text-xs font-medium text-signal">Ver todas</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {goals.map((g) => <GoalCard key={g.id} goal={g} verMetaHref="/metas" />)}
        </div>
      </div>

      <FlowView entradas={totalEntradas} gastos={gastosReais} metas={metasContribuicoes} disponivel={saldo} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-semibold text-text">Hoje</span>
          <Link href="/movimentacoes" className="text-xs font-medium text-signal">Ver todas</Link>
        </div>
        <div className="space-y-2">
          {movsHoje.length === 0 ? (
            <EmptyState text="Nenhuma movimentacao hoje ainda." />
          ) : (
            movsHoje.map((m) => (
              <TransactionRow key={m.id} mov={m} onEdit={setEditing} onDelete={removeTransaction} />
            ))
          )}
        </div>
      </div>

      {editing && (
        <TransactionForm
          editing={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => editTransaction({ id: editing.id, ...input })}
        />
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6 animate-pulse">
      <div className="h-40 rounded-lg bg-surface border border-border" />
      <div className="h-32 rounded-lg bg-surface border border-border" />
    </div>
  );
}
