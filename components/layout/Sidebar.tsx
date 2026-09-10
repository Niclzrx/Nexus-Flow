"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ArrowLeftRight, Target, PieChart, BarChart3,
  Tags, Settings, ChevronLeft, ChevronRight, Waves,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/orcamento", label: "Orçamento", icon: PieChart },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/categorias", label: "Categorias", icon: Tags },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-full border-r border-border bg-surface transition-[width] duration-base"
      style={{ width: collapsed ? 56 : 256 }}
    >
      <div className="flex items-center gap-2 h-12 px-4 shrink-0 border-b border-border">
        <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 bg-signal">
          <Waves className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && <span className="font-display text-sm font-semibold tracking-tight text-text">NEXUS FLOW</span>}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-fast"
              style={{
                background: active ? "color-mix(in srgb, var(--signal) 15%, transparent)" : "transparent",
                color: active ? "var(--signal)" : "var(--text-muted)",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-border">
        <Link
          href="/configuracoes"
          className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm"
          style={{ color: pathname === "/configuracoes" ? "var(--signal)" : "var(--text-muted)" }}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="font-medium">Configurações</span>}
        </Link>
        <button
          onClick={onToggleCollapsed}
          className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-text-faint"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
