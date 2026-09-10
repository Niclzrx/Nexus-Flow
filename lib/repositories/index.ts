import { MockRepository } from "./mockRepository";
import { SupabaseRepository } from "./supabaseRepository";
import type { FinanceRepository } from "./types";

/**
 * Única linha que muda no dia em que o backend entrar no ar:
 * defina NEXT_PUBLIC_DATA_SOURCE=supabase no .env.local (com as
 * credenciais preenchidas) e todo o app passa a ler/gravar no Supabase.
 * Nenhum componente, hook ou página precisa saber disso.
 */
function createRepository(): FinanceRepository {
  const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";
  return source === "supabase" ? new SupabaseRepository() : new MockRepository();
}

// Singleton — evita recriar o client Supabase / o estado do mock a cada import.
export const repository: FinanceRepository = createRepository();
