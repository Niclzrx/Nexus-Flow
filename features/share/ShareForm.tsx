"use client";

import { useState, type FormEvent } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/lib/providers/FinanceProvider";

interface ShareFormProps {
  onClose: () => void;
}

export function ShareForm({ onClose }: ShareFormProps) {
  const { addShare } = useFinance();
  const [titulo, setTitulo] = useState("Meu resumo financeiro");
  const [showResumo, setShowResumo] = useState(true);
  const [showGrafico, setShowGrafico] = useState(true);
  const [showGastosCategoria, setShowGastosCategoria] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>("never"); // never | 1h | 24h | 7d

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expires_at =
        expiresIn === "never"
          ? null
          : new Date(Date.now() + (expiresIn === "1h" ? 1 : expiresIn === "24h" ? 24 : 168) * 60 * 60 * 1000).toISOString();
      const share = await addShare({
        titulo,
        show_resumo: showResumo,
        show_grafico: showGrafico,
        show_gastos_categoria: showGastosCategoria,
        expires_at,
      });
      const url = `${window.location.origin}/compartilhar/${share.id}`;
      setShareUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[14px] border border-border bg-surface p-6 animate-nx-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-5">
          <Link2 className="h-4 w-4 text-signal" />
          <h2 className="font-display text-sm font-semibold text-text">Compartilhar resumo</h2>
        </div>

        {!shareUrl ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-xs font-medium text-text-muted mb-1.5">
                Titulo
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
                placeholder="Meu resumo financeiro"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-text-muted">O que compartilhar</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResumo}
                  onChange={(e) => setShowResumo(e.target.checked)}
                  className="rounded border-border text-signal focus:ring-signal/30"
                />
                <span className="text-sm text-text">Resumo geral</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrafico}
                  onChange={(e) => setShowGrafico(e.target.checked)}
                  className="rounded border-border text-signal focus:ring-signal/30"
                />
                <span className="text-sm text-text">Grafico de saldo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGastosCategoria}
                  onChange={(e) => setShowGastosCategoria(e.target.checked)}
                  className="rounded border-border text-signal focus:ring-signal/30"
                />
                <span className="text-sm text-text">Gastos por categoria</span>
              </label>
            </div>

            <div>
              <label htmlFor="expiresIn" className="block text-xs font-medium text-text-muted mb-1.5">
                Expiração
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
              >
                <option value="never">Nunca expira</option>
                <option value="1h">Expira em 1 hora</option>
                <option value="24h">Expira em 24 horas</option>
                <option value="7d">Expira em 7 dias</option>
              </select>
              <p className="text-[11px] text-text-faint mt-1">Após expirar, o link mostra “não encontrado”.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? "Gerando..." : "Gerar link"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">Link gerado! Copie e compartilhe:</p>
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface-elevated px-3 py-2.5">
              <span className="flex-1 text-sm text-text truncate font-mono">{shareUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-text-muted hover:text-text transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <Button variant="secondary" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
