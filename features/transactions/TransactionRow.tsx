"use client";

import { Pencil, FileText } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { fmt, fmtDate } from "@/lib/format";
import type { Transaction } from "@/types";

interface TransactionRowProps {
  mov: Transaction;
  onEdit?: (mov: Transaction) => void;
  onDelete?: (id: string) => void;
}

/**
 * Linha de movimentação com ações sempre visíveis (não depende de hover,
 * que não existe em touch). Clicar na linha abre a edição — os detalhes
 * completos (observação, forma de pagamento) já aparecem lá.
 */
export function TransactionRow({ mov, onEdit, onDelete }: TransactionRowProps) {
  const isEntrada = mov.tipo === "entrada";
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => onEdit?.(mov)}
        disabled={!onEdit}
        className="flex-1 flex items-center gap-3 rounded-md px-3 py-2.5 border border-border bg-surface text-left transition-colors duration-150 disabled:cursor-default enabled:hover:bg-surface-elevated enabled:hover:border-border-strong"
      >
        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-surface-elevated text-text-muted">
          <CategoryIcon categoria={mov.categoria} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate text-text">{mov.descricao}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-text-faint">{mov.categoria}</span>
            {mov.metodo && <span className="text-xs text-text-faint">· {mov.metodo}</span>}
            {mov.observacao && (
              <span className="flex items-center gap-1 text-xs text-text-faint">
                <FileText className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{mov.observacao}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-medium" style={{ color: isEntrada ? "var(--success)" : "var(--error)" }}>
            {isEntrada ? "+ " : "– "}{fmt(mov.valor)}
          </div>
          <div className="font-mono text-[11px] text-text-faint">{fmtDate(mov.data)}</div>
        </div>
      </button>

      {hasActions && (
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(mov)}
              className="h-full w-8 rounded-md flex items-center justify-center border border-border text-text-muted"
              aria-label="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <ConfirmDeleteButton label="Excluir movimentação" onConfirm={() => onDelete(mov.id)} sizeClassName="h-full w-8" />
          )}
        </div>
      )}
    </div>
  );
}
