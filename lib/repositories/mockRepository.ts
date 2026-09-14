import type {
  BudgetLimit,
  Category,
  Goal,
  NewBudgetLimit,
  NewGoal,
  NewTransaction,
  NewShare,
  Profile,
  Share,
  Transaction,
  UpdateGoal,
  UpdateTransaction,
} from "@/types";
import { MOCK_BUDGET, MOCK_CATEGORIES, MOCK_GOALS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import type { FinanceRepository } from "./types";

// Estado em memoria — reinicia a cada reload do servidor/dev server.
// Suficiente para desenvolver e demonstrar a UI sem depender de backend.
let transactions = [...MOCK_TRANSACTIONS];
let goals = [...MOCK_GOALS];
let budgetLimits = [...MOCK_BUDGET];
let categories = [...MOCK_CATEGORIES];
let shares: Share[] = [];
let profile: Profile = {
  id: "mock-user",
  nome: "Usuario Mock",
  tema: "dark",
  saldo_inicial: 0,
};

const MOCK_USER_ID = "mock-user";
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export class MockRepository implements FinanceRepository {
  async getProfile(): Promise<Profile> {
    await delay();
    return { ...profile };
  }

  async updateProfile(input: Partial<Pick<Profile, "nome" | "tema" | "saldo_inicial">>): Promise<Profile> {
    await delay();
    profile = { ...profile, ...input };
    return { ...profile };
  }

  async listTransactions(offset = 0, limit = 50): Promise<Transaction[]> {
    await delay();
    return [...transactions].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(offset, offset + limit);
  }

  async addTransaction(input: NewTransaction): Promise<Transaction> {
    await delay();
    const created: Transaction = {
      ...input,
      id: newId("t"),
      user_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
    };
    transactions = [created, ...transactions];
    return created;
  }

  async updateTransaction(input: UpdateTransaction): Promise<Transaction> {
    await delay();
    let updated: Transaction | undefined;
    transactions = transactions.map((t) => {
      if (t.id !== input.id) return t;
      updated = { ...t, ...input };
      return updated;
    });
    if (!updated) throw new Error(`Transacao ${input.id} nao encontrada`);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    await delay();
    transactions = transactions.filter((t) => t.id !== id);
  }

  async listGoals(): Promise<Goal[]> {
    await delay();
    return [...goals];
  }

  async addGoal(input: NewGoal): Promise<Goal> {
    await delay();
    const created: Goal = {
      ...input,
      valor_guardado: input.valor_guardado ?? 0,
      id: newId("g"),
      user_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
    };
    goals = [...goals, created];
    return created;
  }

  async updateGoal(input: UpdateGoal): Promise<Goal> {
    await delay();
    let updated: Goal | undefined;
    goals = goals.map((g) => {
      if (g.id !== input.id) return g;
      updated = { ...g, ...input };
      return updated;
    });
    if (!updated) throw new Error(`Meta ${input.id} nao encontrada`);
    return updated;
  }

  async deleteGoal(id: string): Promise<void> {
    await delay();
    goals = goals.filter((g) => g.id !== id);
  }

  async listBudgetLimits(mesReferencia: string): Promise<BudgetLimit[]> {
    await delay();
    return budgetLimits.filter((b) => b.mes_referencia === mesReferencia);
  }

  async upsertBudgetLimit(input: NewBudgetLimit): Promise<BudgetLimit> {
    await delay();
    const existing = budgetLimits.find(
      (b) => b.categoria === input.categoria && b.mes_referencia === input.mes_referencia
    );
    if (existing) {
      const updated = { ...existing, limite: input.limite };
      budgetLimits = budgetLimits.map((b) => (b.id === existing.id ? updated : b));
      return updated;
    }
    const created: BudgetLimit = { ...input, id: newId("b"), user_id: MOCK_USER_ID };
    budgetLimits = [...budgetLimits, created];
    return created;
  }

  async deleteBudgetLimit(id: string): Promise<void> {
    await delay();
    budgetLimits = budgetLimits.filter((b) => b.id !== id);
  }

  async listCategories(): Promise<Category[]> {
    await delay();
    return [...categories];
  }

  async addCategory(nome: string): Promise<Category> {
    await delay();
    const exists = categories.some((c) => c.nome.trim().toLowerCase() === nome.trim().toLowerCase());
    if (exists) throw new Error(`A categoria "${nome}" ja existe`);
    const created: Category = { id: newId("c"), user_id: MOCK_USER_ID, nome, icone: null, created_at: new Date().toISOString() };
    categories = [...categories, created];
    return created;
  }

  async deleteCategory(id: string): Promise<void> {
    await delay();
    categories = categories.filter((c) => c.id !== id);
  }

  async addShare(input: NewShare): Promise<Share> {
    await delay();
    const created: Share = {
      ...input,
      id: newId("s"),
      user_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
    };
    shares = [...shares, created];
    return created;
  }

  async listShares(): Promise<Share[]> {
    await delay();
    return [...shares];
  }

  async deleteShare(id: string): Promise<void> {
    await delay();
    shares = shares.filter((s) => s.id !== id);
  }

  async getShare(id: string): Promise<Share | null> {
    await delay();
    return shares.find((s) => s.id === id) ?? null;
  }
}
