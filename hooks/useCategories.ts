"use client";

import { useFinance } from "@/lib/providers/FinanceProvider";

/** Fatia de useFinance() focada em categorias. */
export function useCategories() {
  const { categories, loading, error, addCategory, removeCategory } = useFinance();
  return { categories, loading, error, addCategory, removeCategory };
}
