"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

const CATEGORIA_PROTEGIDA = "Metas";

export default function CategoriasPage() {
  const { categories, loading, addCategory, removeCategory } = useCategories();
  const { transactions } = useTransactions();
  const [novo, setNovo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const usoPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => { map[t.categoria] = (map[t.categoria] ?? 0) + 1; });
    return map;
  }, [transactions]);

  const handleAdd = async () => {
    const nome = novo.trim();
    if (!nome) return;
    setErro(null);
    try {
      await addCategory(nome);
      setNovo("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a categoria.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <span className="font-display text-lg font-semibold text-text">Categorias</span>

      <div className="flex gap-2 mt-5 mb-1">
        <input
          value={novo}
          onChange={(e) => { setNovo(e.target.value); setErro(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nova categoria"
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none bg-surface-elevated border border-border text-text"
        />
        <Button variant="primary" disabled={!novo.trim()} onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
      {erro && <p className="text-xs text-error mb-3">{erro}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4 animate-pulse">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 rounded-md bg-surface border border-border" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
          {categories.map((c) => {
            const usos = usoPorCategoria[c.nome] ?? 0;
            const protegida = c.nome === CATEGORIA_PROTEGIDA;
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-md px-3 py-2.5 bg-surface border border-border">
                <CategoryIcon categoria={c.nome} className="h-4 w-4" />
                <span className="text-sm flex-1 text-text">
                  {c.nome}
                  {usos > 0 && <span className="text-text-faint"> · {usos} mov.</span>}
                </span>
                <ConfirmDeleteButton
                  label={`Excluir ${c.nome}`}
                  disabled={protegida}
                  disabledReason={protegida ? "Usada pelo sistema de metas — não pode ser excluída" : undefined}
                  onConfirm={() => removeCategory(c.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
