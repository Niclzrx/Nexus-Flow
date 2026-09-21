import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware de autenticacao e renovacao de sessao.
 *
 * Quando NEXT_PUBLIC_DATA_SOURCE=supabase:
 * - Renova o token de sessao a cada navegacao
 * - "/" e publica (landing com botoes de login); demais rotas exigem login
 * - Redireciona usuarios logados de /login e /cadastro para /
 *
 * Quando NEXT_PUBLIC_DATA_SOURCE=mock (ou nao definido):
 * - Deixa a request passar direto (sem autenticacao)
 */
export async function middleware(request: NextRequest) {
  // Força HTTPS em produção
  if (process.env.NODE_ENV === "production") {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  // Rate limit simples para rotas sensíveis (brute-force / enumeração)
  // Só atua quando em modo supabase; em mock não há risco.
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const pathname = request.nextUrl.pathname;
    const isSensitive = pathname.startsWith("/login") || pathname.startsWith("/cadastro") || pathname.startsWith("/compartilhar");
    if (isSensitive) {
      const now = Date.now();
      // janela de 60s, max 20 requisições por IP por rota
      const key = `${ip}:${pathname.split("/")[1]}`;
      const entry = (globalThis as unknown as { __nfRateLimit?: Map<string, number[]> }).__nfRateLimit ?? new Map<string, number[]>();
      (globalThis as unknown as { __nfRateLimit?: Map<string, number[]> }).__nfRateLimit = entry;
      const hits = (entry.get(key) ?? []).filter((t) => now - t < 60_000);
      hits.push(now);
      entry.set(key, hits);
      if (hits.length > 20) {
        return new NextResponse("Muitas requisições. Tente novamente em instantes.", { status: 429, headers: { "Retry-After": "60" } });
      }
    }
  }

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
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOpts = {
              ...options,
              httpOnly: options.httpOnly ?? true,
              secure: process.env.NODE_ENV === "production" ? true : options.secure ?? false,
              sameSite: options.sameSite ?? "lax",
              path: options.path ?? "/",
            };
            response.cookies.set(name, value, secureOpts);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rotas publicas que nao precisam de autenticacao
  const publicRoutes = ["/login", "/cadastro", "/compartilhar"];
  const isPublicRoute =
    pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route));

  // Se nao esta autenticado e nao esta em rota publica, vai para a landing
  // (que tem os botoes de login/cadastro)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
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
