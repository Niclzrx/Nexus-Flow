"use client";

import { Sun, Moon, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/format";

interface NavbarProps {
  saldoTotal: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNovaMovimentacao: () => void;
  period: string;
}

export function Navbar({ saldoTotal, theme, onToggleTheme, onNovaMovimentacao, period }: NavbarProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 md:px-6 shrink-0 border-b border-border bg-bg">
      <span className="font-display text-xs font-medium uppercase tracking-wide text-text-faint">{period}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm hidden sm:inline text-text-muted">{fmt(saldoTotal)}</span>
        <button
          onClick={onToggleTheme}
          className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-text-muted"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Button variant="primary" onClick={onNovaMovimentacao}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nova movimentação</span>
        </Button>
      </div>
    </header>
  );
}
