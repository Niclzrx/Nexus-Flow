import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase para uso em Client Components ("use client").
 * Lê as credenciais públicas de NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
