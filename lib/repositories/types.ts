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

/**
 * FinanceRepository é o único ponto de contato entre a UI (hooks/ e
 * features/) e a fonte de dados real.
 *
 * Hoje só existe `MockRepository`, que vive em memória. Quando o backend
 * Supabase estiver pronto, `SupabaseRepository` implementa exatamente
 * este mesmo contrato — nenhum componente ou hook precisa mudar, só a
 * variável de ambiente NEXT_PUBLIC_DATA_SOURCE (ver lib/repositories/index.ts).
 *
 * Todo método é assíncrono de propósito: o mock já se comporta como se
 * fosse uma chamada de rede, então a troca para Supabase não muda o
 * formato dos hooks (loading/error/data continuam funcionando igual).
 */
export interface FinanceRepository {
  // Transações
  listTransactions(): Promise<Transaction[]>;
  addTransaction(input: NewTransaction): Promise<Transaction>;
  updateTransaction(input: UpdateTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Metas
  listGoals(): Promise<Goal[]>;
  addGoal(input: NewGoal): Promise<Goal>;
  updateGoal(input: UpdateGoal): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  // Orçamento
  listBudgetLimits(mesReferencia: string): Promise<BudgetLimit[]>;
  upsertBudgetLimit(input: NewBudgetLimit): Promise<BudgetLimit>;
  deleteBudgetLimit(id: string): Promise<void>;

  // Categorias
  listCategories(): Promise<Category[]>;
  addCategory(nome: string): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}
