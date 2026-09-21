/**
 * Tipos de dominio do Nexus Flow.
 *
 * Desenhados para corresponder diretamente as tabelas do Supabase
 * (ver supabase/migrations/0001_init.sql). Usar snake_case nos campos
 * que vem do banco evita uma camada extra de mapeamento entre o
 * repositorio Supabase e o resto do app.
 */

export type TransactionType = "entrada" | "gasto";

export type PaymentMethod =
  | "Pix"
  | "Cart\u00e3o de d\u00e9bito"
  | "Cart\u00e3o de cr\u00e9dito"
  | "Dinheiro"
  | "Boleto";

export interface Category {
  id: string;
  user_id: string;
  nome: string;
  icone: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  tipo: TransactionType;
  valor: number;
  descricao: string;
  categoria: string;
  data: string; // ISO date (YYYY-MM-DD)
  metodo: PaymentMethod | null;
  observacao: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  nome: string;
  valor_meta: number;
  valor_guardado: number;
  created_at: string;
}

export interface BudgetLimit {
  id: string;
  user_id: string;
  categoria: string;
  limite: number;
  mes_referencia: string; // "2026-09"
}

export interface Profile {
  id: string;
  nome: string | null;
  tema: "dark" | "light";
  saldo_inicial: number;
}

export interface Share {
  id: string;
  user_id: string;
  titulo: string;
  show_resumo: boolean;
  show_grafico: boolean;
  show_gastos_categoria: boolean;
  expires_at: string | null;
  created_at: string;
}

/** Payloads de criacao — sem campos gerados pelo banco (id, user_id, created_at). */
export type NewTransaction = Omit<Transaction, "id" | "user_id" | "created_at">;
export type UpdateTransaction = Partial<NewTransaction> & { id: string };

export type NewGoal = Omit<Goal, "id" | "user_id" | "created_at" | "valor_guardado"> & {
  valor_guardado?: number;
};
export type UpdateGoal = Partial<Omit<Goal, "id" | "user_id" | "created_at">> & { id: string };

export type NewBudgetLimit = Omit<BudgetLimit, "id" | "user_id">;

export type NewShare = Omit<Share, "id" | "user_id" | "created_at">;
