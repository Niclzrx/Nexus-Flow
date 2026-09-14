"use client";

import { useCallback, useState } from "react";
import { useFinance } from "@/lib/providers/FinanceProvider";

const PAGE_SIZE = 20;

/** Fatia de useFinance() focada em movimentações, com paginação client-side. */
export function useTransactions() {
  const { transactions, loading, error, addTransaction, editTransaction, removeTransaction } = useFinance();

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const paginated = transactions.slice(0, (page + 1) * PAGE_SIZE);

  const loadMore = useCallback(() => {
    setPage((p) => {
      const next = p + 1;
      if (next * PAGE_SIZE >= transactions.length) {
        setHasMore(false);
      }
      return next;
    });
  }, [transactions.length]);

  const resetPagination = useCallback(() => {
    setPage(0);
    setHasMore(true);
  }, []);

  return {
    transactions: paginated,
    allTransactions: transactions,
    loading,
    error,
    hasMore,
    loadMore,
    resetPagination,
    addTransaction,
    editTransaction,
    removeTransaction,
  };
}
