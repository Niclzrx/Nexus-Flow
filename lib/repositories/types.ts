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

/**
 * FinanceRepository e o unico ponto de contato entre a UI (hooks/ e
 * features/) e a fonte de dados real.
 *
 * Hoje so existe MockRepository, que vive em memoria. Quando o backend
 * Supabase estiver pronto, SupabaseRepository implementa exatamente
 * este mesmo contrato — nenhum componente ou hook precisa mudar, so a
 * variavel de ambiente NEXT_PUBLIC_DATA_SOURCE (ver lib/repositories/index.ts).
 *
 * Todo metodo e assincino de proposito: o mock ja se comporta como se
 * fosse uma chamada de rede, entao a troca para Supabase nao muda o
 * formato dos hooks (loading/error/data continuam funcionando igual).
 */
export interface FinanceRepository {
  // Perfil
  getProfile(): Promise<Profile>;
  updateProfile(input: Partial<Pick<Profile, "nome" | "tema" | "saldo_inicial">>): Promise<Profile>;

  // Transacoes
  listTransactions(offset?: number, limit?: number): Promise<Transaction[]>;
  addTransaction(input: NewTransaction): Promise<Transaction>;
  updateTransaction(input: UpdateTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Metas
  listGoals(): Promise<Goal[]>;
  addGoal(input: NewGoal): Promise<Goal>;
  updateGoal(input: UpdateGoal): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  // Orcamento
  listBudgetLimits(mesReferencia: string): Promise<BudgetLimit[]>;
  upsertBudgetLimit(input: NewBudgetLimit): Promise<BudgetLimit>;
  deleteBudgetLimit(id: string): Promise<void>;

  // Categorias
  listCategories(): Promise<Category[]>;
  addCategory(nome: string): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Compartilhamento
  addShare(input: NewShare): Promise<Share>;
  listShares(): Promise<Share[]>;
  deleteShare(id: string): Promise<void>;
  getShare(id: string): Promise<Share | null>;
}
