"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { friendlyAuthError } from "@/lib/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; password: string }) => {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) throw new Error(friendlyAuthError(authError.message));
    router.push("/");
    router.refresh();
  };

  return <AuthForm mode="login" onSubmit={handleLogin} error={error} />;
}
