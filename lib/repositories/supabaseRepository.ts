import { createClient } from "@/lib/supabase/client";
import type {
  BudgetLimit,
  Category,
  Goal,
  NewBudgetLimit,
  NewGoal,
  NewTransaction,
  Transaction,
  UpdateGoal,
  UpdateTransaction,
} from "@/types";
import type { FinanceRepository } from "./types";

/**
 * Implementação real, com Supabase. Cumpre exatamente o mesmo contrato de
 * `MockRepository` — quando NEXT_PUBLIC_DATA_SOURCE=supabase, esta classe
 * passa a ser usada em todo o app sem nenhuma mudança de componente/hook.
 *
 * `user_id` nunca é passado manualmente: as políticas de RLS usam
 * auth.uid(), e o Supabase client já injeta a sessão do usuário logado.
 */
export class SupabaseRepository implements FinanceRepository {
  private supabase = createClient();

  async listTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .order("data", { ascending: false });
    if (error) throw error;
    return data;
  }

  async addTransaction(input: NewTransaction): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from("transactions")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateTransaction(input: UpdateTransaction): Promise<Transaction> {
    const { id, ...rest } = input;
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
    const { data, error } = await this.supabase
      .from("goals")
      .insert({ ...input, valor_guardado: input.valor_guardado ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateGoal(input: UpdateGoal): Promise<Goal> {
    const { id, ...rest } = input;
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
    const { data, error } = await this.supabase
      .from("budget_limits")
      .upsert(input, { onConflict: "user_id,categoria,mes_referencia" })
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
    const { data, error } = await this.supabase
      .from("categories")
      .insert({ nome })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  }
}
