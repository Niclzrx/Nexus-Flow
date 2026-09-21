/** Traduz erros comuns do Supabase Auth para mensagens em PT. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email rate limit exceeded") || m.includes("rate limit")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar (verifique a caixa de entrada).";
  }
  if (m.includes("invalid login credentials")) {
    return "Email ou senha incorretos.";
  }
  if (m.includes("user already registered")) {
    return "Este email já tem conta. Tente entrar.";
  }
  if (m.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  return message;
}
