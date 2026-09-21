"use client";

import { useState } from "react";
import { X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useCategories";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(editing?.is_recurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<"weekly" | "monthly" | "yearly">(
    (editing?.recurrence_interval as "weekly" | "monthly" | "yearly") ?? "monthly"
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(editing?.attachment_url ?? null);
  const [uploading, setUploading] = useState(false);

  const canSave = Number(valor) > 0 && descricao.trim().length > 0 && categoria;

  const handleSubmit = async () => {
    if (!canSave) return;
    setErrorMsg(null);
    setSaving(true);
    try {
      await onSubmit({
        tipo,
        valor: Number(valor),
        descricao,
        categoria,
        data,
        metodo,
        observacao: observacao || null,
        attachment_url: attachmentUrl,
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
        recurrence_end_date: null,
        parent_id: null,
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      // Zod error tem issues; mostra primeira mensagem amigável
      setErrorMsg(msg.slice(0, 200));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Arquivo muito grande (máx 5 MB)");
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Precisa estar logado para enviar arquivo");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      setAttachmentUrl(data.publicUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
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
            value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Almoço" maxLength={120}
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
            value={observacao ?? ""} onChange={(e) => setObservacao(e.target.value)} rows={2} maxLength={500}
            className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none bg-surface-elevated border border-border text-text"
          />
        </Field>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-border text-signal focus:ring-signal/30"
          />
          <span className="text-sm text-text">Repetir mensalmente</span>
          <span className="text-[11px] text-text-faint">(gera próxima ocorrência automaticamente)</span>
        </label>
        {isRecurring && (
          <div className="mb-4">
            <label className="block text-xs mb-1 text-text-faint">Intervalo</label>
            <select
              value={recurrenceInterval}
              onChange={(e) => setRecurrenceInterval(e.target.value as "weekly" | "monthly" | "yearly")}
              className="w-full rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs mb-1 text-text-faint">Comprovante (opcional)</label>
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-border bg-surface-elevated text-text-muted cursor-pointer hover:border-border-strong">
              <Paperclip className="h-4 w-4" />
              <span>{uploading ? "Enviando..." : attachmentUrl ? "Trocar arquivo" : "Escolher arquivo (até 5 MB)"}</span>
              <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" disabled={uploading} />
            </label>
            {attachmentUrl && (
              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-signal hover:underline">
                ver
              </a>
            )}
          </div>
          {attachmentUrl && <p className="text-[11px] text-success mt-1 truncate">Anexado</p>}
        </div>

        {errorMsg && (
          <p className="text-xs text-error mb-3 bg-error/10 border border-error/20 rounded-md px-3 py-2">{errorMsg}</p>
        )}

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
