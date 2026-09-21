"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { friendlyAuthError } from "@/lib/auth-errors";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const handleSignup = async (data: { email: string; password: string; nome?: string; saldoInicial?: number }) => {
    setError(null);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome ?? null,
          saldo_inicial: data.saldoInicial ?? 0,
        },
      },
    });
    if (authError) throw new Error(friendlyAuthError(authError.message));
    // Com "Confirm email" ligado (padrao do Supabase), nao ha sessao aqui:
    // o usuario precisa clicar no link do email antes de entrar.
    if (!authData.session) {
      setPendingEmail(data.email);
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (pendingEmail) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold text-text">Nexus Flow</h1>
          <p className="text-sm text-text-muted mt-3">
            Conta criada! Enviamos um link de confirmação para <span className="text-text">{pendingEmail}</span>.
            Clique nele e depois entre em <a href="/login" className="text-signal hover:underline">/login</a>.
          </p>
        </div>
      </div>
    );
  }

  return <AuthForm mode="signup" onSubmit={handleSignup} error={error} />;
}
