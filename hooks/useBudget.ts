"use client";

import { useFinance } from "@/lib/providers/FinanceProvider";

/** Fatia de useFinance() focada em orçamento do mês corrente. */
export function useBudget() {
  const { budgetLimits, loading, error, setBudgetLimit, removeBudgetLimit } = useFinance();
  return { budgetLimits, loading, error, setBudgetLimit, removeBudgetLimit };
}
