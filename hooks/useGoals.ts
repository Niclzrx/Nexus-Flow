"use client";

import { useFinance } from "@/lib/providers/FinanceProvider";

/** Fatia de useFinance() focada em metas. */
export function useGoals() {
  const { goals, loading, error, addGoal, editGoal, removeGoal } = useFinance();
  return { goals, loading, error, addGoal, editGoal, removeGoal };
}
