"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useCategories";
import { todayISO } from "@/lib/format";
import type { NewTransaction, PaymentMethod, Transaction, TransactionType } from "@/types";

const PAYMENT_METHODS: PaymentMethod[] = ["Pix", "Cartão de débito", "Cartão de crédito", "Dinheiro", "Boleto"];

interface TransactionFormProps {
  editing?: Transaction | null;
  onClose: () => void;
  onSubmit: (input: NewTransaction) => Promise<unknown>;
}

export function TransactionForm({ editing, onClose, onSubmit }: TransactionFormProps) {
  const { categories } = useCategories();
  const [tipo, setTipo] = useState<TransactionType>(editing?.tipo ?? "gasto");
  const [valor, setValor] = useState(editing?.valor?.toString() ?? "");
  const [descricao, setDescricao] = useState(editing?.descricao ?? "");
  const [categoria, setCategoria] = useState(editing?.categoria ?? categories[0]?.nome ?? "");
  const [data, setData] = useState(editing?.data ?? todayISO());
  const [metodo, setMetodo] = useState<PaymentMethod>((editing?.metodo as PaymentMethod) ?? "Pix");
  const [observacao, setObservacao] = useState(editing?.observacao ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = Number(valor) > 0 && descricao.trim().length > 0 && categoria;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({ tipo, valor: Number(valor), descricao, categoria, data, metodo, observacao: observacao || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg p-5 bg-surface border border-border animate-nx-modal-in"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-sm font-semibold text-text">
            {editing ? "Editar movimentação" : "Adicionar movimentação"}
          </span>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-text-faint" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {(["entrada", "gasto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className="rounded-md py-2 text-sm font-medium capitalize border border-border"
              style={{
                background: tipo === t ? (t === "entrada" ? "color-mix(in srgb, var(--success) 15%, transparent)" : "color-mix(in srgb, var(--error) 15%, transparent)") : "var(--surface-elevated)",
                color: tipo === t ? (t === "entrada" ? "var(--success)" : "var(--error)") : "var(--text-muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <Field label="Valor">
          <input
            type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00"
            className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
          />
        </Field>

        <Field label="Descrição">
          <input
            value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Almoço"
            className="w-full rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <select
              value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
            >
              {categories.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Data">
            <input
              type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none bg-surface-elevated border border-border text-text"
            />
          </Field>
        </div>

        <Field label="Forma de pagamento">
          <select
            value={metodo} onChange={(e) => setMetodo(e.target.value as PaymentMethod)}
            className="w-full rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
          >
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>

        <Field label="Observação (opcional)" last>
          <textarea
            value={observacao ?? ""} onChange={(e) => setObservacao(e.target.value)} rows={2}
            className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none bg-surface-elevated border border-border text-text"
          />
        </Field>

        <Button variant="primary" className="w-full justify-center" disabled={!canSave || saving} onClick={handleSubmit}>
          {editing ? "Salvar alterações" : "Adicionar movimentação"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? "mb-4" : "mb-3"}>
      <label className="block text-xs mb-1 text-text-faint">{label}</label>
      {children}
    </div>
  );
}
