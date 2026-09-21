"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useBudget } from "@/hooks/useBudget";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Button } from "@/components/ui/Button";
import { fmt, currentMonthRef } from "@/lib/format";
import type { BudgetLimit } from "@/types";

export default function OrcamentoPage() {
  const { budgetLimits, setBudgetLimit, removeBudgetLimit, loading } = useBudget();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const gastoPorCategoria = useMemo(() => {
    const ref = currentMonthRef();
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.tipo === "gasto" && t.data.startsWith(ref))
      .forEach((t) => {
        map[t.categoria] = (map[t.categoria] ?? 0) + t.valor;
      });
    return map;
  }, [transactions]);

  const estourados = budgetLimits.filter((b) => (gastoPorCategoria[b.categoria] ?? 0) >= b.limite);
  const pertoLimite = budgetLimits.filter((b) => {
    const pct = ((gastoPorCategoria[b.categoria] ?? 0) / b.limite) * 100;
    return pct >= 85 && pct < 100;
  });

  const categoriasSemOrcamento = categories.filter(
    (c) => !budgetLimits.some((b) => b.categoria === c.nome) && c.nome !== "Metas"
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="grid sm:grid-cols-2 gap-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-surface border border-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <span className="font-display text-lg font-semibold text-text">Orçamento</span>

      {(estourados.length > 0 || pertoLimite.length > 0) && (
        <div className="mt-4 space-y-2">
          {estourados.length > 0 && (
            <div className="rounded-lg px-4 py-3 flex items-start gap-3 bg-error/10 border border-error/30 text-error">
              <span className="text-sm font-medium">⚠️ {estourados.length} orçamento(s) estourado(s): {estourados.map((b) => b.categoria).join(", ")} — revise seus gastos.</span>
            </div>
          )}
          {pertoLimite.length > 0 && (
            <div className="rounded-lg px-4 py-3 flex items-start gap-3 bg-ember/10 border border-ember/30 text-ember">
              <span className="text-sm font-medium">⏳ Perto do limite: {pertoLimite.map((b) => `${b.categoria} (${Math.round((gastoPorCategoria[b.categoria] / b.limite) * 100)}%)`).join(", ")}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {budgetLimits.map((b) => (
          <BudgetCard
            key={b.id}
            budget={b}
            gasto={gastoPorCategoria[b.categoria] ?? 0}
            onUpdate={setBudgetLimit}
            onDelete={removeBudgetLimit}
          />
        ))}

        {categoriasSemOrcamento.length > 0 && (
          <NewBudgetCard categorias={categoriasSemOrcamento} onCreate={setBudgetLimit} />
        )}
      </div>

      {budgetLimits.length === 0 && categoriasSemOrcamento.length === 0 && (
        <p className="text-sm text-text-faint mt-4">
          Crie uma categoria em Categorias para poder definir um orçamento pra ela.
        </p>
      )}
    </div>
  );
}

function BudgetCard({
  budget, gasto, onUpdate, onDelete,
}: {
  budget: BudgetLimit;
  gasto: number;
  onUpdate: (input: { categoria: string; limite: number; mes_referencia: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [limite, setLimiteValue] = useState(budget.limite.toString());
  const pct = Math.min(100, Math.round((gasto / budget.limite) * 100));
  const perto = pct >= 85 && pct < 100;
  const estourou = pct >= 100;

  const salvar = async () => {
    const n = Number(limite);
    if (!n || n <= 0) return;
    await onUpdate({ categoria: budget.categoria, limite: n, mes_referencia: budget.mes_referencia });
    setEditing(false);
  };

  return (
    <div className="rounded-lg p-4 bg-surface border border-border">
      <div className="flex items-center gap-2 mb-2">
        <CategoryIcon categoria={budget.categoria} className="h-4 w-4" />
        <span className="font-display text-sm font-medium flex-1 text-text">{budget.categoria}</span>
        {estourou && <Badge tone="error">Limite atingido</Badge>}
        {perto && !estourou && <Badge tone="ember">Perto do limite</Badge>}
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            autoFocus
            value={limite}
            onChange={(e) => setLimiteValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvar()}
            className="flex-1 rounded-md px-2 py-1 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
          />
          <Button variant="primary" className="px-2 py-1" onClick={salvar}>Salvar</Button>
          <Button variant="secondary" className="px-2 py-1" onClick={() => { setEditing(false); setLimiteValue(budget.limite.toString()); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex items-baseline gap-1 mb-2">
          <span className="font-mono text-sm font-medium text-text">{fmt(gasto)}</span>
          <span className="font-mono text-xs text-text-faint"> / {fmt(budget.limite)}</span>
        </div>
      )}

      <ProgressBar pct={pct} tone={estourou ? "error" : perto ? "ember" : "signal"} animateKey={budget.id + limite} />

      {!editing && (
        <div className="flex justify-end gap-1 mt-2">
          <button onClick={() => setEditing(true)} className="h-6 w-6 rounded flex items-center justify-center text-text-faint" aria-label="Editar limite">
            <Pencil className="h-3 w-3" />
          </button>
          <ConfirmDeleteButton label="Remover orçamento" onConfirm={() => onDelete(budget.id)} />
        </div>
      )}
    </div>
  );
}

function NewBudgetCard({
  categorias, onCreate,
}: {
  categorias: { id: string; nome: string }[];
  onCreate: (input: { categoria: string; limite: number; mes_referencia: string }) => Promise<unknown>;
}) {
  const [categoria, setCategoria] = useState(categorias[0]?.nome ?? "");
  const [limite, setLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const criar = async () => {
    const n = Number(limite);
    if (!n || n <= 0 || !categoria) return;
    setSaving(true);
    try {
      await onCreate({ categoria, limite: n, mes_referencia: currentMonthRef() });
      setLimite("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg p-4 flex flex-col gap-2 border border-dashed border-border">
      <span className="font-display text-sm font-medium text-text-muted">Novo orçamento</span>
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
      >
        {categorias.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
      </select>
      <input
        placeholder="Limite mensal" type="number" min="0.01" step="0.01" value={limite} onChange={(e) => setLimite(e.target.value)}
        className="rounded-md px-3 py-2 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
      />
      <Button variant="primary" disabled={!limite || saving} onClick={criar}>
        <Plus className="h-3.5 w-3.5" /> Definir orçamento
      </Button>
    </div>
  );
}
