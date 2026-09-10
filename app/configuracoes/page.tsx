"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <span className="font-display text-lg font-semibold text-text">Configurações</span>

      <div className="rounded-lg p-4 max-w-md bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">Tema</div>
            <div className="text-xs text-text-faint">Claro ou escuro</div>
          </div>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-text-muted"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-lg p-4 max-w-md bg-surface border border-border">
        <div className="text-sm font-medium text-text mb-1">Fonte de dados</div>
        <div className="text-xs text-text-faint mb-2">
          Controlado por <code className="font-mono">NEXT_PUBLIC_DATA_SOURCE</code> no <code className="font-mono">.env.local</code>.
        </div>
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: dataSource === "supabase" ? "color-mix(in srgb, var(--success) 15%, transparent)" : "color-mix(in srgb, var(--ember) 15%, transparent)",
            color: dataSource === "supabase" ? "var(--success)" : "var(--ember)",
          }}
        >
          {dataSource === "supabase" ? "Supabase conectado" : "Dados mockados (sem backend)"}
        </span>
      </div>
    </div>
  );
}
