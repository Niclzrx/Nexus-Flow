"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { repository } from "@/lib/repositories";
import { currentMonthRef } from "@/lib/format";
import type {
  BudgetLimit, Category, Goal, NewBudgetLimit, NewGoal, NewTransaction,
  Transaction, UpdateGoal, UpdateTransaction,
} from "@/types";

interface FinanceContextValue {
  transactions: Transaction[];
  goals: Goal[];
  budgetLimits: BudgetLimit[];
  categories: Category[];
  loading: boolean;
  error: Error | null;

  addTransaction: (input: NewTransaction) => Promise<Transaction>;
  editTransaction: (input: UpdateTransaction) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<void>;

  addGoal: (input: NewGoal) => Promise<Goal>;
  editGoal: (input: UpdateGoal) => Promise<Goal>;
  removeGoal: (id: string) => Promise<void>;

  setBudgetLimit: (input: NewBudgetLimit) => Promise<BudgetLimit>;
  removeBudgetLimit: (id: string) => Promise<void>;

  addCategory: (nome: string) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, g, b, c] = await Promise.all([
          repository.listTransactions(),
          repository.listGoals(),
          repository.listBudgetLimits(currentMonthRef()),
          repository.listCategories(),
        ]);
        if (cancelled) return;
        setTransactions(t);
        setGoals(g);
        setBudgetLimits(b);
        setCategories(c);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addTransaction = useCallback(async (input: NewTransaction) => {
    const created = await repository.addTransaction(input);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const editTransaction = useCallback(async (input: UpdateTransaction) => {
    const updated = await repository.updateTransaction(input);
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    await repository.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addGoal = useCallback(async (input: NewGoal) => {
    const created = await repository.addGoal(input);
    setGoals((prev) => [...prev, created]);
    return created;
  }, []);

  const editGoal = useCallback(async (input: UpdateGoal) => {
    const updated = await repository.updateGoal(input);
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    return updated;
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    await repository.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const setBudgetLimit = useCallback(async (input: NewBudgetLimit) => {
    const saved = await repository.upsertBudgetLimit(input);
    setBudgetLimits((prev) => {
      const exists = prev.some((b) => b.id === saved.id);
      return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved];
    });
    return saved;
  }, []);

  const removeBudgetLimit = useCallback(async (id: string) => {
    await repository.deleteBudgetLimit(id);
    setBudgetLimits((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addCategory = useCallback(async (nome: string) => {
    const created = await repository.addCategory(nome);
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await repository.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions, goals, budgetLimits, categories, loading, error,
      addTransaction, editTransaction, removeTransaction,
      addGoal, editGoal, removeGoal,
      setBudgetLimit, removeBudgetLimit,
      addCategory, removeCategory,
    }),
    [transactions, goals, budgetLimits, categories, loading, error,
      addTransaction, editTransaction, removeTransaction,
      addGoal, editGoal, removeGoal, setBudgetLimit, removeBudgetLimit, addCategory, removeCategory]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance precisa ser usado dentro de <FinanceProvider>");
  return ctx;
}
