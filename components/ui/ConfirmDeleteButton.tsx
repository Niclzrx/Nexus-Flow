"use client";

import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";

interface ConfirmDeleteButtonProps {
  onConfirm: () => unknown;
  label?: string;
  disabled?: boolean;
  disabledReason?: string;
  sizeClassName?: string;
}

/**
 * Botão de excluir com confirmação inline (dois toques: pedir e confirmar).
 * Usado em toda ação destrutiva do app (movimentações, metas, orçamento,
 * categorias) pra evitar exclusão acidental, especialmente em touch — um
 * toque errado não some com nada.
 */
export function ConfirmDeleteButton({ onConfirm, label = "Excluir", disabled, disabledReason, sizeClassName = "h-7 w-7" }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <button
        disabled
        title={disabledReason}
        className={`${sizeClassName} rounded-md flex items-center justify-center border border-border text-text-faint opacity-50 cursor-not-allowed`}
        aria-label={disabledReason ?? "Ação indisponível"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          className={`${sizeClassName} rounded-md flex items-center justify-center border border-error/30 bg-error/10 text-error`}
          aria-label={`Confirmar ${label.toLowerCase()}`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={`${sizeClassName} rounded-md flex items-center justify-center border border-border text-text-muted`}
          aria-label="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`${sizeClassName} rounded-md flex items-center justify-center border border-border text-error`}
      aria-label={label}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
