import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recurrence
 * Gera no servidor as ocorrências faltantes de transações recorrentes.
 * Protegida: exige header `x-cron-secret` igual a `CRON_SECRET` em produção,
 * ou ser chamada com service_role (ex: pg_cron via supabase).
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const got = request.headers.get("x-cron-secret");
    if (got !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const admin = createClient(url, serviceKey);
  const { data, error } = await admin.rpc("generate_recurring_transactions");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data ?? 0 });
}

// Também aceita GET para teste manual local
export async function GET(request: Request) {
  return POST(request);
}
