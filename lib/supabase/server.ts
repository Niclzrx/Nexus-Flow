import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase para uso em Server Components, Route Handlers e Server
 * Actions. Propaga a sessão do usuário via cookies, o que é o que permite
 * às políticas de RLS (ver supabase/migrations/0001_init.sql) saberem
 * quem está fazendo a query.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (veja .env.local.example)."
    );
  }
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secureOpts: CookieOptions = {
                ...options,
                httpOnly: options.httpOnly ?? true,
                secure: process.env.NODE_ENV === "production" ? true : options.secure ?? false,
                sameSite: (options.sameSite as CookieOptions["sameSite"]) ?? "lax",
                path: options.path ?? "/",
              };
              cookieStore.set(name, value, secureOpts);
            });
          } catch {
            // Chamado de um Server Component sem permissão de escrita de
            // cookies — ok ignorar se houver middleware renovando a sessão.
          }
        },
      },
    }
  );
}
