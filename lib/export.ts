import type { BudgetLimit, Goal, Transaction } from "@/types";

interface ExportInput {
  transactions: Transaction[];
  goals: Goal[];
  budgetLimits: BudgetLimit[];
}

/**
 * Gera e baixa um .xlsx com o snapshot financeiro atual, em 4 abas.
 * O import de "xlsx" (SheetJS, ~700kb) é dinâmico de propósito: só entra
 * no bundle do navegador quando alguém realmente clica em exportar, em vez
 * de pesar no carregamento inicial do app.
 */
export async function exportFinanceData({ transactions, goals, budgetLimits }: ExportInput) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // --- Movimentações ---------------------------------------------------
  const movRows = [...transactions]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .map((t) => ({
      Data: t.data,
      Tipo: t.tipo === "entrada" ? "Entrada" : "Gasto",
      Categoria: t.categoria,
      Descrição: t.descricao,
      Valor: t.tipo === "entrada" ? t.valor : -t.valor,
      "Forma de pagamento": t.metodo ?? "",
      Observação: t.observacao ?? "",
    }));
  const movSheet = XLSX.utils.json_to_sheet(movRows);
  movSheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 32 }, { wch: 12 }, { wch: 20 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, movSheet, "Movimentações");

  // --- Resumo ------------------------------------------------------------
  const isMetas = (t: Transaction) => t.categoria === "Metas";
  const totalEntradas = transactions.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const totalGastos = transactions.filter((t) => t.tipo === "gasto").reduce((a, t) => a + t.valor, 0);
  const entradasReais = totalEntradas - transactions.filter((t) => t.tipo === "entrada" && isMetas(t)).reduce((a, t) => a + t.valor, 0);
  const gastosReais = totalGastos - transactions.filter((t) => t.tipo === "gasto" && isMetas(t)).reduce((a, t) => a + t.valor, 0);
  const enviadoParaMetas = totalGastos - gastosReais - (totalEntradas - entradasReais);

  const resumoRows = [
    { Métrica: "Entradas", Valor: entradasReais },
    { Métrica: "Gastos", Valor: gastosReais },
    { Métrica: "Enviado para metas", Valor: enviadoParaMetas },
    { Métrica: "Disponível", Valor: totalEntradas - totalGastos },
  ];
  const resumoSheet = XLSX.utils.json_to_sheet(resumoRows);
  resumoSheet["!cols"] = [{ wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, resumoSheet, "Resumo");

  // --- Metas ---------------------------------------------------------
  const metasRows = goals.map((g) => ({
    Meta: g.nome,
    "Valor guardado": g.valor_guardado,
    "Valor alvo": g.valor_meta,
    "Falta": Math.max(0, g.valor_meta - g.valor_guardado),
    "Progresso (%)": g.valor_meta > 0 ? Math.round((g.valor_guardado / g.valor_meta) * 100) : 0,
  }));
  const metasSheet = XLSX.utils.json_to_sheet(metasRows);
  metasSheet["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, metasSheet, "Metas");

  // --- Orçamento ------------------------------------------------------
  const gastoPorCategoria: Record<string, number> = {};
  transactions.filter((t) => t.tipo === "gasto").forEach((t) => {
    gastoPorCategoria[t.categoria] = (gastoPorCategoria[t.categoria] ?? 0) + t.valor;
  });
  const orcamentoRows = budgetLimits.map((b) => ({
    Categoria: b.categoria,
    "Mês": b.mes_referencia,
    Limite: b.limite,
    Gasto: gastoPorCategoria[b.categoria] ?? 0,
    "Uso (%)": Math.round(((gastoPorCategoria[b.categoria] ?? 0) / b.limite) * 100),
  }));
  const orcamentoSheet = XLSX.utils.json_to_sheet(orcamentoRows);
  orcamentoSheet["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, orcamentoSheet, "Orçamento");

  const filename = `nexus-flow_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
