import type { BudgetLimit, Goal, Profile, Transaction } from "@/types";

interface ExportInput {
  transactions: Transaction[];
  goals: Goal[];
  budgetLimits: BudgetLimit[];
  profile?: Profile | null;
}

/**
 * Gera e baixa um .xlsx com o snapshot financeiro atual, em 4 abas.
 * O import de "xlsx" (SheetJS, ~700kb) e dinamico de proposito: so entra
 * no bundle do navegador quando alguem realmente clica em exportar, em vez
 * de pesar no carregamento inicial do app.
 */
export async function exportFinanceData({ transactions, goals, budgetLimits, profile }: ExportInput) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const saldoInicial = profile?.saldo_inicial ?? 0;

  // --- Movimentacoes ---------------------------------------------------
  const movRows = [...transactions]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .map((t) => ({
      Data: t.data,
      Tipo: t.tipo === "entrada" ? "Entrada" : "Gasto",
      Categoria: t.categoria,
      Descricao: t.descricao,
      Valor: t.tipo === "entrada" ? t.valor : -t.valor,
      "Forma de pagamento": t.metodo ?? "",
      Observacao: t.observacao ?? "",
    }));

  // Totais
  const totalEntradas = transactions.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const totalGastos = transactions.filter((t) => t.tipo === "gasto").reduce((a, t) => a + t.valor, 0);
  const saldoFinal = saldoInicial + totalEntradas - totalGastos;

  // Adicionar linhas de total ao final
  movRows.push(
    { Data: "", Tipo: "", Categoria: "", Descricao: "--- TOTAL ---", Valor: 0, "Forma de pagamento": "", Observacao: "" },
    { Data: "", Tipo: "", Categoria: "", Descricao: "Total Entradas", Valor: totalEntradas, "Forma de pagamento": "", Observacao: "" },
    { Data: "", Tipo: "", Categoria: "", Descricao: "Total Gastos", Valor: -totalGastos, "Forma de pagamento": "", Observacao: "" },
    { Data: "", Tipo: "", Categoria: "", Descricao: "Saldo Inicial", Valor: saldoInicial, "Forma de pagamento": "", Observacao: "" },
    { Data: "", Tipo: "", Categoria: "", Descricao: "Saldo Final", Valor: saldoFinal, "Forma de pagamento": "", Observacao: "" }
  );

  const movSheet = XLSX.utils.json_to_sheet(movRows);
  movSheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 32 }, { wch: 12 }, { wch: 20 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, movSheet, "Movimentacoes");

  // --- Resumo ------------------------------------------------------------
  const isMetas = (t: Transaction) => t.categoria === "Metas";
  const entradasReais = totalEntradas - transactions.filter((t) => t.tipo === "entrada" && isMetas(t)).reduce((a, t) => a + t.valor, 0);
  const gastosReais = totalGastos - transactions.filter((t) => t.tipo === "gasto" && isMetas(t)).reduce((a, t) => a + t.valor, 0);
  const enviadoParaMetas = totalGastos - gastosReais - (totalEntradas - entradasReais);

  const resumoRows = [
    { Metrica: "Saldo Inicial", Valor: saldoInicial },
    { Metrica: "Entradas", Valor: entradasReais },
    { Metrica: "Gastos", Valor: gastosReais },
    { Metrica: "Enviado para metas", Valor: enviadoParaMetas },
    { Metrica: "Disponivel", Valor: saldoFinal },
  ];
  const resumoSheet = XLSX.utils.json_to_sheet(resumoRows);
  resumoSheet["!cols"] = [{ wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, resumoSheet, "Resumo");

  // --- Totais (aba separada) ---------------------------------------------
  const totaisRows = [
    { Metrica: "Saldo Inicial", Valor: saldoInicial },
    { Metrica: "Total Entradas", Valor: totalEntradas },
    { Metrica: "Total Gastos", Valor: totalGastos },
    { Metrica: "Saldo Final", Valor: saldoFinal },
    { Metrica: "", Valor: "" },
    { Metrica: "Entradas Reais (sem Metas)", Valor: entradasReais },
    { Metrica: "Gastos Reais (sem Metas)", Valor: gastosReais },
    { Metrica: "Enviado para Metas", Valor: enviadoParaMetas },
  ];
  const totaisSheet = XLSX.utils.json_to_sheet(totaisRows);
  totaisSheet["!cols"] = [{ wch: 30 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, totaisSheet, "Totais");

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

  // --- Orcamento ------------------------------------------------------
  const gastoPorCategoria: Record<string, number> = {};
  transactions.filter((t) => t.tipo === "gasto").forEach((t) => {
    gastoPorCategoria[t.categoria] = (gastoPorCategoria[t.categoria] ?? 0) + t.valor;
  });
  const orcamentoRows = budgetLimits.map((b) => ({
    Categoria: b.categoria,
    "Mes": b.mes_referencia,
    Limite: b.limite,
    Gasto: gastoPorCategoria[b.categoria] ?? 0,
    "Uso (%)": Math.round(((gastoPorCategoria[b.categoria] ?? 0) / b.limite) * 100),
  }));
  const orcamentoSheet = XLSX.utils.json_to_sheet(orcamentoRows);
  orcamentoSheet["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, orcamentoSheet, "Orcamento");

  const filename = `nexus-flow_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
