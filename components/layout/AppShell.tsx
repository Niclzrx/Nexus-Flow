"use client";

import { useState, type ReactNode } from "react";
import { FinanceProvider } from "@/lib/providers/FinanceProvider";
import { useFinance } from "@/lib/providers/FinanceProvider";
import { useTheme } from "@/hooks/useTheme";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { ShareForm } from "@/features/share/ShareForm";

const currentPeriodLabel = () => {
  const label = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { profile, transactions, addTransaction } = useFinance();

  const saldoInicial = profile?.saldo_inicial ?? 0;
  const saldoMovimentacoes = transactions.reduce((acc, t) => acc + (t.tipo === "entrada" ? t.valor : -t.valor), 0);
  const saldoTotal = saldoInicial + saldoMovimentacoes;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          saldoTotal={saldoTotal}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onNovaMovimentacao={() => setModalOpen(true)}
          onCompartilhar={() => setShareOpen(true)}
          period={currentPeriodLabel()}
        />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
      </div>

      <MobileNav />

      {modalOpen && (
        <TransactionForm onClose={() => setModalOpen(false)} onSubmit={addTransaction} />
      )}

      {shareOpen && (
        <ShareForm onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <Shell>{children}</Shell>
    </FinanceProvider>
  );
}
