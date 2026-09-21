"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { repository } from "@/lib/repositories";
import { currentMonthRef, todayISO } from "@/lib/format";
import { missingOccurrences } from "@/lib/recurrence";
import type {
  BudgetLimit, Category, Goal, NewBudgetLimit, NewGoal, NewTransaction,
  NewShare, Profile, Share, Transaction, UpdateGoal, UpdateTransaction,
} from "@/types";

interface FinanceContextValue {
  profile: Profile | null;
  transactions: Transaction[];
  goals: Goal[];
  budgetLimits: BudgetLimit[];
  categories: Category[];
  shares: Share[];
  loading: boolean;
  error: Error | null;

  updateProfile: (input: Partial<Pick<Profile, "nome" | "tema" | "saldo_inicial">>) => Promise<Profile>;

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

  addShare: (input: NewShare) => Promise<Share>;
  removeShare: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, t, g, b, c, s] = await Promise.all([
          repository.getProfile(),
          repository.listTransactions(),
          repository.listGoals(),
          repository.listBudgetLimits(currentMonthRef()),
          repository.listCategories(),
          repository.listShares(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setTransactions(t);
        setGoals(g);
        setBudgetLimits(b);
        setCategories(c);
        setShares(s);
        // gera ocorrências faltantes de transações recorrentes (até hoje)
        const today = todayISO();
        const parents = t.filter((tx) => tx.is_recurring && tx.parent_id === null);
        for (const parent of parents) {
          const dates = missingOccurrences(parent, t, today);
          for (const d of dates) {
            try {
              const created = await repository.addTransaction({
                tipo: parent.tipo,
                valor: parent.valor,
                descricao: parent.descricao,
                categoria: parent.categoria,
                data: d,
                metodo: parent.metodo,
                observacao: parent.observacao,
                is_recurring: false,
                recurrence_interval: null,
                recurrence_end_date: null,
                parent_id: parent.id,
              });
              if (!cancelled) setTransactions((prev) => [created, ...prev]);
              // atualiza array local para próximas iterações não duplicarem
              t.push({ ...parent, id: created.id, data: d, parent_id: parent.id, is_recurring: false } as Transaction);
            } catch {
              // ignora duplicata / erro de validação
            }
          }
        }
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

  const updateProfile = useCallback(async (input: Partial<Pick<Profile, "nome" | "tema" | "saldo_inicial">>) => {
    const updated = await repository.updateProfile(input);
    setProfile(updated);
    return updated;
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

  const addShare = useCallback(async (input: NewShare) => {
    const created = await repository.addShare(input);
    setShares((prev) => [created, ...prev]);
    return created;
  }, []);

  const removeShare = useCallback(async (id: string) => {
    await repository.deleteShare(id);
    setShares((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      profile, transactions, goals, budgetLimits, categories, shares, loading, error,
      updateProfile,
      addTransaction, editTransaction, removeTransaction,
      addGoal, editGoal, removeGoal,
      setBudgetLimit, removeBudgetLimit,
      addCategory, removeCategory,
      addShare, removeShare,
    }),
    [profile, transactions, goals, budgetLimits, categories, shares, loading, error,
      updateProfile,
      addTransaction, editTransaction, removeTransaction,
      addGoal, editGoal, removeGoal, setBudgetLimit, removeBudgetLimit, addCategory, removeCategory,
      addShare, removeShare]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance precisa ser usado dentro de <FinanceProvider>");
  return ctx;
}
