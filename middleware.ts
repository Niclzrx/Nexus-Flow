import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware de autenticacao e renovacao de sessao.
 *
 * Quando NEXT_PUBLIC_DATA_SOURCE=supabase:
 * - Renova o token de sessao a cada navegacao
 * - Redireciona usuarios deslogados para /login
 * - Redireciona usuarios logados de /login e /cadastro para /
 *
 * Quando NEXT_PUBLIC_DATA_SOURCE=mock (ou nao definido):
 * - Deixa a request passar direto (sem autenticacao)
 */
export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error(
      "Supabase não configurado: NEXT_PUBLIC_DATA_SOURCE=supabase mas NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY estão vazias. Verifique o .env.local."
    );
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rotas publicas que nao precisam de autenticacao
  const publicRoutes = ["/login", "/cadastro", "/compartilhar"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Se nao esta autenticado e nao esta em rota publica, redireciona para login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se esta autenticado e tenta acessar login/cadastro, redireciona para home
  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
