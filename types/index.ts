/**
 * Tipos de domínio do Nexus Flow.
 *
 * Desenhados para corresponder diretamente às tabelas do Supabase
 * (ver supabase/migrations/0001_init.sql). Usar snake_case nos campos
 * que vêm do banco evita uma camada extra de mapeamento entre o
 * repositório Supabase e o resto do app.
 */

export type TransactionType = "entrada" | "gasto";

export type PaymentMethod =
  | "Pix"
  | "Cartão de débito"
  | "Cartão de crédito"
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
}

/** Payloads de criação — sem campos gerados pelo banco (id, user_id, created_at). */
export type NewTransaction = Omit<Transaction, "id" | "user_id" | "created_at">;
export type UpdateTransaction = Partial<NewTransaction> & { id: string };

export type NewGoal = Omit<Goal, "id" | "user_id" | "created_at" | "valor_guardado"> & {
  valor_guardado?: number;
};
export type UpdateGoal = Partial<Omit<Goal, "id" | "user_id" | "created_at">> & { id: string };

export type NewBudgetLimit = Omit<BudgetLimit, "id" | "user_id">;
