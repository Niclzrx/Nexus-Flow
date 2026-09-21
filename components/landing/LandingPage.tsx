import Link from "next/link";
import { ArrowRight, PieChart, Target, Wallet } from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Movimentações",
    desc: "Entradas e gastos com categoria, método e data. Tudo pesquisável.",
  },
  {
    icon: Target,
    title: "Metas",
    desc: "Guardar e resgatar com progresso visual, sem misturar com o saldo.",
  },
  {
    icon: PieChart,
    title: "Relatórios",
    desc: "Evolução do saldo e gastos por categoria, mês a mês.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 max-w-6xl w-full mx-auto">
        <span className="font-display text-lg font-bold text-text">Nexus Flow</span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-medium px-4 py-2 rounded-[10px] border border-border text-text-muted hover:text-text hover:border-signal/40 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-xs font-semibold px-4 py-2 rounded-[10px] bg-signal text-white hover:brightness-110 transition-all"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-medium uppercase tracking-widest text-signal mb-4">
          Controle financeiro pessoal
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-text leading-[1.05]">
          Para onde o seu dinheiro está indo.
        </h1>
        <p className="text-sm md:text-base text-text-muted mt-5 max-w-xl">
          Registre movimentações, acompanhe metas e veja relatórios claros —
          sem planilha, sem complicação. Seus dados, só seus.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-[12px] bg-signal text-white hover:brightness-110 transition-all"
          >
            Começar grátis <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-6 py-3 rounded-[12px] border border-border text-text-muted hover:text-text hover:border-signal/40 transition-colors"
          >
            Já tenho conta
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-16 w-full text-left">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[14px] border border-border bg-surface p-5">
              <div className="w-9 h-9 rounded-[10px] bg-signal/10 text-signal flex items-center justify-center mb-3">
                <Icon size={18} />
              </div>
              <p className="font-display text-sm font-semibold text-text">{title}</p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-[11px] text-text-faint py-6">
        Nexus Flow — feito para organizar a vida financeira
      </footer>
    </div>
  );
}
