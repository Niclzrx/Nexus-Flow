"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { fmt, todayISO } from "@/lib/format";
import type { Goal, NewTransaction } from "@/types";

export default function MetasPage() {
  const { goals, loading, addGoal, editGoal, removeGoal } = useGoals();
  const { addTransaction } = useTransactions();
  const [nome, setNome] = useState("");
  const [valorMeta, setValorMeta] = useState("");

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <span className="font-display text-lg font-semibold text-text">Metas</span>
      <p className="text-xs text-text-faint mt-1 max-w-md">
        Adicionar valor numa meta gera uma movimentação e sai do seu disponível — não é só um número separado.
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5 animate-pulse">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-lg bg-surface border border-border" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {goals.map((g) => (
            <GoalEditableCard
              key={g.id}
              goal={g}
              onUpdateGoal={editGoal}
              onDeleteGoal={removeGoal}
              onAddTransaction={addTransaction}
            />
          ))}

          <div className="rounded-lg p-4 flex flex-col gap-2 border border-dashed border-border">
            <span className="font-display text-sm font-medium text-text-muted">Nova meta</span>
            <input
              placeholder="Nome (ex.: Celular)" value={nome} onChange={(e) => setNome(e.target.value)}
              className="rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
            />
            <input
              placeholder="Valor alvo" type="number" min="0.01" step="0.01" value={valorMeta} onChange={(e) => setValorMeta(e.target.value)}
              className="rounded-md px-3 py-2 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
            />
            <Button
              variant="primary"
              disabled={!nome || !valorMeta}
              onClick={async () => {
                await addGoal({ nome, valor_meta: Number(valorMeta) });
                setNome(""); setValorMeta("");
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Criar meta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalEditableCard({
  goal, onUpdateGoal, onDeleteGoal, onAddTransaction,
}: {
  goal: Goal;
  onUpdateGoal: (input: { id: string; valor_guardado: number }) => Promise<unknown>;
  onDeleteGoal: (id: string) => Promise<unknown>;
  onAddTransaction: (input: NewTransaction) => Promise<unknown>;
}) {
  const [editingValor, setEditingValor] = useState(false);
  const [modo, setModo] = useState<"adicionar" | "remover">("adicionar");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  const pct = Math.min(100, Math.round((goal.valor_guardado / goal.valor_meta) * 100));
  const falta = Math.max(0, goal.valor_meta - goal.valor_guardado);

  const confirmar = async () => {
    const n = Number(valor);
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      const novoValor = modo === "adicionar" ? goal.valor_guardado + n : Math.max(0, goal.valor_guardado - n);
      // Atualiza o progresso da meta e, ao mesmo tempo, registra uma
      // movimentação real — o dinheiro efetivamente sai (ou volta) do
      // disponível, em vez de só mudar um número isolado.
      await Promise.all([
        onUpdateGoal({ id: goal.id, valor_guardado: novoValor }),
        onAddTransaction({
          tipo: modo === "adicionar" ? "gasto" : "entrada",
          valor: n,
          descricao: modo === "adicionar" ? `Guardado para: ${goal.nome}` : `Resgatado de: ${goal.nome}`,
          categoria: "Metas",
          data: todayISO(),
          metodo: null,
          observacao: null,
        }),
      ]);
      setValor("");
      setEditingValor(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg p-4 bg-surface border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-sm font-medium text-text">{goal.nome}</span>
        <span className="font-mono text-xs text-text-faint">{fmt(goal.valor_meta)}</span>
      </div>
      <ProgressBar pct={pct} animateKey={goal.id} />
      <div className="flex items-center justify-between mt-2 mb-3">
        <span className="font-mono text-[11px] text-text-faint">{pct}% · {fmt(goal.valor_guardado)} guardado</span>
        <span className="font-mono text-xs text-text-muted">Falta {fmt(falta)}</span>
      </div>

      {editingValor ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setModo("adicionar")}
              className="rounded-md py-1.5 text-xs font-medium border border-border flex items-center justify-center gap-1"
              style={{
                background: modo === "adicionar" ? "color-mix(in srgb, var(--success) 15%, transparent)" : "var(--surface-elevated)",
                color: modo === "adicionar" ? "var(--success)" : "var(--text-muted)",
              }}
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
            <button
              onClick={() => setModo("remover")}
              className="rounded-md py-1.5 text-xs font-medium border border-border flex items-center justify-center gap-1"
              style={{
                background: modo === "remover" ? "color-mix(in srgb, var(--error) 15%, transparent)" : "var(--surface-elevated)",
                color: modo === "remover" ? "var(--error)" : "var(--text-muted)",
              }}
            >
              <Minus className="h-3 w-3" /> Remover
            </button>
          </div>
          <input
            type="number"
            min="0.01"
            step="0.01"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
            className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
            onKeyDown={(e) => e.key === "Enter" && confirmar()}
          />
          <p className="text-[11px] text-text-faint">
            {modo === "adicionar"
              ? "Isso vai sair do seu disponível agora."
              : "Isso volta pro seu disponível agora."}
          </p>
          <div className="flex gap-1.5">
            <Button variant="primary" className="flex-1 justify-center" disabled={!valor || saving} onClick={confirmar}>
              Confirmar
            </Button>
            <Button variant="secondary" onClick={() => { setEditingValor(false); setValor(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingValor(true); setModo("adicionar"); }}
            className="flex-1 rounded-md py-1.5 text-xs font-medium bg-surface-elevated border border-border text-text-muted"
          >
            Adicionar valor
          </button>
          <ConfirmDeleteButton label="Excluir meta" onConfirm={() => onDeleteGoal(goal.id)} />
        </div>
      )}
    </div>
  );
}
