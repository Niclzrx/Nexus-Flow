"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportFinanceData } from "@/lib/export";
import { useTransactions } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useBudget } from "@/hooks/useBudget";
import { useFinance } from "@/lib/providers/FinanceProvider";
import type { Transaction } from "@/types";

/**
 * Botao de exportar para Excel. Recebe opcionalmente uma lista de
 * movimentacoes ja filtrada (ex.: a busca/filtro ativo em Movimentacoes) —
 * sem isso, exporta tudo.
 */
export function ExportButton({ transactionsOverride }: { transactionsOverride?: Transaction[] }) {
  const { allTransactions } = useTransactions();
  const { goals } = useGoals();
  const { budgetLimits } = useBudget();
  const { profile } = useFinance();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFinanceData({
        transactions: transactionsOverride ?? allTransactions,
        goals,
        budgetLimits,
        profile,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{exporting ? "Gerando..." : "Exportar Excel"}</span>
    </Button>
  );
}
