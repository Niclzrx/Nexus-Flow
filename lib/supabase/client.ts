import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase para uso em Client Components ("use client").
 * Lê as credenciais públicas de NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (veja .env.local.example)."
    );
  }
  return createBrowserClient(url, anonKey);
}
