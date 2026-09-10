import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase para uso em Server Components, Route Handlers e Server
 * Actions. Propaga a sessão do usuário via cookies, o que é o que permite
 * às políticas de RLS (ver supabase/migrations/0001_init.sql) saberem
 * quem está fazendo a query.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita de
            // cookies — ok ignorar se houver middleware renovando a sessão.
          }
        },
      },
    }
  );
}
