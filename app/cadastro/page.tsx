"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (data: { email: string; password: string; nome?: string; saldoInicial?: number }) => {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome ?? null,
          saldo_inicial: data.saldoInicial ?? 0,
        },
      },
    });
    if (authError) throw authError;
    router.push("/");
    router.refresh();
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} error={error} />;
}
