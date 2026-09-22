import { createClient } from "@/lib/supabase/client";
import {
  categoryNameSchema,
  newBudgetLimitSchema,
  newGoalSchema,
  newShareSchema,
  newTransactionSchema,
  profileUpdateSchema,
  updateGoalSchema,
  updateTransactionSchema,
} from "@/lib/validators";
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
import type { FinanceRepository } from "./types";

/**
 * Implementacao real, com Supabase. Cumpre exatamente o mesmo contrato de
 * MockRepository — quando NEXT_PUBLIC_DATA_SOURCE=supabase, esta classe
 * passa a ser usada em todo o app sem nenhuma mudanca de componente/hook.
 *
 * user_id nunca e passado manualmente: as politicas de RLS usam
 * auth.uid(), e o Supabase client ja injeta a sessao do usuario logado.
 */
export class SupabaseRepository implements FinanceRepository {
  private supabase = createClient();

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(input: Partial<Pick<Profile, "nome" | "tema" | "saldo_inicial">>): Promise<Profile> {
    const parsed = profileUpdateSchema.parse(input);
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada — faça login novamente");
    const { data, error } = await this.supabase
      .from("profiles")
      .update(parsed)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listTransactions(offset = 0, limit = 50): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .order("data", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
  }

  async addTransaction(input: NewTransaction): Promise<Transaction> {
    const parsed = newTransactionSchema.parse(input);
    const { data, error } = await this.supabase
      .from("transactions")
      .insert(parsed)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateTransaction(input: UpdateTransaction): Promise<Transaction> {
    const parsed = updateTransactionSchema.parse(input);
    const { id, ...rest } = parsed;
    const { data, error } = await this.supabase
      .from("transactions")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  }

  async listGoals(): Promise<Goal[]> {
    const { data, error } = await this.supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async addGoal(input: NewGoal): Promise<Goal> {
    const parsed = newGoalSchema.parse({ ...input, valor_guardado: input.valor_guardado ?? 0 });
    const { data, error } = await this.supabase
      .from("goals")
      .insert(parsed)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateGoal(input: UpdateGoal): Promise<Goal> {
    const parsed = updateGoalSchema.parse(input);
    const { id, ...rest } = parsed;
    const { data, error } = await this.supabase
      .from("goals")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteGoal(id: string): Promise<void> {
    const { error } = await this.supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  }

  async listBudgetLimits(mesReferencia: string): Promise<BudgetLimit[]> {
    const { data, error } = await this.supabase
      .from("budget_limits")
      .select("*")
      .eq("mes_referencia", mesReferencia);
    if (error) throw error;
    return data;
  }

  async upsertBudgetLimit(input: NewBudgetLimit): Promise<BudgetLimit> {
    const parsed = newBudgetLimitSchema.parse(input);
    // RLS ja escopa a busca ao usuario logado; o trigger set_own_user_id
    // preenche user_id no insert. (Upsert direto com onConflict em user_id
    // nao funciona porque user_id nao vai no payload.)
    const { data: existing, error: findError } = await this.supabase
      .from("budget_limits")
      .select("id")
      .eq("categoria", parsed.categoria)
      .eq("mes_referencia", parsed.mes_referencia)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { data, error } = await this.supabase
        .from("budget_limits")
        .update({ limite: parsed.limite })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await this.supabase
      .from("budget_limits")
      .insert(parsed)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBudgetLimit(id: string): Promise<void> {
    const { error } = await this.supabase.from("budget_limits").delete().eq("id", id);
    if (error) throw error;
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async addCategory(nome: string): Promise<Category> {
    const parsed = categoryNameSchema.parse(nome);
    const { data, error } = await this.supabase
      .from("categories")
      .insert({ nome: parsed })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  }

  async addShare(input: NewShare): Promise<Share> {
    const parsed = newShareSchema.parse(input);
    const { data, error } = await this.supabase
      .from("shares")
      .insert(parsed)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listShares(): Promise<Share[]> {
    const { data, error } = await this.supabase
      .from("shares")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async deleteShare(id: string): Promise<void> {
    const { error } = await this.supabase.from("shares").delete().eq("id", id);
    if (error) throw error;
  }

  async getShare(id: string): Promise<Share | null> {
    const { data, error } = await this.supabase
      .from("shares")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }
}
