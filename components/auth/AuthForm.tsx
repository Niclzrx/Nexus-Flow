"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { friendlyAuthError } from "@/lib/auth-errors";

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: { email: string; password: string; nome?: string; saldoInicial?: number }) => Promise<void>;
  error?: string | null;
}

export function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // bot protection: honeypot + tempo mínimo
  const [honey, setHoney] = useState("");
  const [mountedAt] = useState(() => Date.now());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honey.trim() !== "") {
      setLocalError("Bot detectado.");
      return;
    }
    if (Date.now() - mountedAt < 800) {
      setLocalError("Aguarde um instante antes de enviar.");
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await onSubmit({
        email,
        password,
        ...(mode === "signup" ? { nome, saldoInicial: Number(saldoInicial) || 0 } : {}),
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Erro ao autenticar";
      console.warn("[auth] erro original:", raw);
      setLocalError(raw);
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError ? friendlyAuthError(localError) : error;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-text">Nexus Flow</h1>
          <p className="text-sm text-text-muted mt-1">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* honeypot anti-bot */}
          <input
            type="text"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            name="website"
          />
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="nome" className="block text-xs font-medium text-text-muted mb-1.5">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label htmlFor="saldoInicial" className="block text-xs font-medium text-text-muted mb-1.5">
                  Saldo inicial
                </label>
                <input
                  id="saldoInicial"
                  type="number"
                  min="0"
                  step="0.01"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
                  placeholder="0,00"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-text-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-text-muted mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30"
              placeholder="Sua senha"
              required
              minLength={6}
            />
          </div>

          {displayError && (
            <div className="rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-sm text-error">
              {displayError}
              {localError && localError !== displayError && (
                <p className="text-[11px] opacity-70 mt-1 break-words">{localError}</p>
              )}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          {mode === "login" ? (
            <>
              Nao tem conta?{" "}
              <a href="/cadastro" className="text-signal hover:underline">Cadastre-se</a>
            </>
          ) : (
            <>
              Ja tem conta?{" "}
              <a href="/login" className="text-signal hover:underline">Entrar</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
