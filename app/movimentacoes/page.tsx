"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { ExportButton } from "@/features/export/ExportButton";
import { fmtDateLong } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types";

export default function MovimentacoesPage() {
  const { transactions, allTransactions, loading, hasMore, loadMore, addTransaction, editTransaction, removeTransaction } = useTransactions();
  const { categories } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"todas" | TransactionType>("todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const filtered = allTransactions.filter((t) => {
    if (filter !== "todas" && t.tipo !== filter) return false;
    if (categoriaFiltro !== "todas" && t.categoria !== categoriaFiltro) return false;
    if (busca.trim() && !t.descricao.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      map[t.data] = map[t.data] ?? [];
      map[t.data].push(t);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <span className="font-display text-lg font-semibold text-text">Movimentações</span>
        <div className="flex items-center gap-2">
          <ExportButton transactionsOverride={filtered} />
          <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Nova
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição"
            className="w-full rounded-md pl-8 pr-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
        >
          <option value="todas">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        {(["todas", "entrada", "gasto"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-3 py-1 text-xs font-medium capitalize border border-border"
            style={{
              background: filter === f ? "color-mix(in srgb, var(--signal) 15%, transparent)" : "var(--surface-elevated)",
              color: filter === f ? "var(--signal)" : "var(--text-muted)",
            }}
          >
            {f === "todas" ? "Todas" : f === "entrada" ? "Entradas" : "Gastos"}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : grouped.length === 0 ? (
        <EmptyState text={allTransactions.length === 0 ? "Nenhuma movimentação por aqui." : "Nada encontrado com esses filtros."} />
      ) : (
        <div className="space-y-5">
          {grouped.map(([data, list]) => (
            <div key={data}>
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-faint">{fmtDateLong(data)}</span>
              <div className="space-y-2 mt-2">
                {list.map((m) => (
                  <TransactionRow
                    key={m.id}
                    mov={m}
                    onEdit={(mov) => { setEditing(mov); setModalOpen(true); }}
                    onDelete={removeTransaction}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <Button variant="secondary" onClick={loadMore} className="w-full mt-4">
              Carregar mais
            </Button>
          )}
        </div>
      )}

      {modalOpen && (
        <TransactionForm
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(input) => (editing ? editTransaction({ id: editing.id, ...input }) : addTransaction(input))}
        />
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-md bg-surface border border-border" />)}
    </div>
  );
}
