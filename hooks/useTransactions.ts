"use client";

import { useFinance } from "@/lib/providers/FinanceProvider";

/** Fatia de useFinance() focada em movimentações. */
export function useTransactions() {
  const { transactions, loading, error, addTransaction, editTransaction, removeTransaction } = useFinance();
  return { transactions, loading, error, addTransaction, editTransaction, removeTransaction };
}
