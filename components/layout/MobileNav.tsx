"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ArrowLeftRight, Target, PieChart, BarChart3 } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/movimentacoes", label: "Movs.", icon: ArrowLeftRight },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/orcamento", label: "Orçamento", icon: PieChart },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch h-14 z-30 bg-surface border-t border-border">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ color: active ? "var(--signal)" : "var(--text-faint)" }}
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
