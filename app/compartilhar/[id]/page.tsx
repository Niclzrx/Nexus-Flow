"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

interface ShareData {
  share: {
    id: string;
    titulo: string;
    show_resumo: boolean;
    show_grafico: boolean;
    show_gastos_categoria: boolean;
    created_at: string;
  };
  profile: {
    nome: string | null;
    saldo_inicial: number;
  };
  transactions: Array<{
    tipo: "entrada" | "gasto";
    valor: number;
    categoria: string;
    data: string;
  }>;
}

export default function CompartilharPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: result, error: rpcError } = await supabase.rpc("get_share_data", {
          share_id: id,
        });
        if (rpcError) throw rpcError;
        if (!result) {
          setError("Compartilhamento nao encontrado");
        } else {
          setData(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar compartilhamento");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Carregando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg px-4">
        <EmptyState text={error || "Compartilhamento nao encontrado"} />
      </div>
    );
  }

  const { share, profile, transactions } = data;

  const totalEntradas = transactions.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const totalGastos = transactions.filter((t) => t.tipo === "gasto").reduce((a, t) => a + t.valor, 0);
  const saldo = (profile?.saldo_inicial ?? 0) + totalEntradas - totalGastos;

  const gastosPorCategoria: Record<string, number> = {};
  transactions
    .filter((t) => t.tipo === "gasto")
    .forEach((t) => {
      gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] ?? 0) + t.valor;
    });

  return (
    <div className="min-h-[100dvh] bg-bg px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-xl font-bold text-text">{share.titulo}</h1>
          {profile.nome && (
            <p className="text-sm text-text-muted mt-1">por {profile.nome}</p>
          )}
        </div>

        {share.show_resumo && (
          <div className="rounded-[14px] border border-border bg-surface p-5 mb-6">
            <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-text-faint mb-4">
              Resumo
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Saldo inicial</span>
                <span className="font-mono text-sm text-text">{fmt(profile?.saldo_inicial ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Entradas</span>
                <span className="font-mono text-sm text-success">{fmt(totalEntradas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Gastos</span>
                <span className="font-mono text-sm text-error">{fmt(-totalGastos)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-medium text-text">Saldo</span>
                <span className="font-mono text-sm font-semibold text-text">{fmt(saldo)}</span>
              </div>
            </div>
          </div>
        )}

        {share.show_grafico && (
          <div className="rounded-[14px] border border-border bg-surface p-5 mb-6">
            <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-text-faint mb-4">
              Evolucao do saldo
            </h2>
            <div className="flex items-end gap-1 h-32">
              {[profile?.saldo_inicial ?? 0, saldo].map((valor, i) => {
                const maxValor = Math.max(Math.abs(totalEntradas), Math.abs(totalGastos), 1);
                const altura = Math.min(Math.abs(valor) / maxValor * 100, 100);
                const barColor = valor >= 0 ? "bg-success" : "bg-error";
                const barHeight = Math.max(altura, 4) + "%";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="font-mono text-[10px] text-text-faint">{fmt(valor)}</span>
                    <div
                      className={"w-full rounded-t-[4px] " + barColor}
                      style={{ height: barHeight }}
                    />
                    <span className="text-[10px] text-text-faint">{i === 0 ? "Inicio" : "Atual"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {share.show_gastos_categoria && Object.keys(gastosPorCategoria).length > 0 && (
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-text-faint mb-4">
              Gastos por categoria
            </h2>
            <div className="space-y-3">
              {Object.entries(gastosPorCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, valor]) => {
                  const barWidth = Math.min((valor / totalGastos) * 100, 100) + "%";
                  return (
                    <div key={categoria}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-text">{categoria}</span>
                        <span className="font-mono text-sm text-error">{fmt(-valor)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-error/60"
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-text-faint mt-8">
          Gerado por Nexus Flow
        </p>
      </div>
    </div>
  );
}
