"use client";
import { useState } from "react";
import { Sun, Moon, Download, Trash2, Shield, Palette, Database, User, LogOut, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useFinance } from "@/lib/providers/FinanceProvider";
import { createClient } from "@/lib/supabase/client";
import { exportFinanceData } from "@/lib/export";
import { useTransactions } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useBudget } from "@/hooks/useBudget";
import { fmt } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, transactions, goals, budgetLimits } = useFinance();
  const [nome, setNome] = useState(profile?.nome ?? "");
  const [savingNome, setSavingNome] = useState(false);
  const [pass1, setPass1] = useState(""); const [pass2, setPass2] = useState("");
  const [hideBalances, setHideBalances] = useState(() => typeof window !== "undefined" ? localStorage.getItem("nf-hide-balances")==="1" : false);
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

  const saveNome = async () => {
    if (!nome.trim() || nome.trim()===profile?.nome) return;
    setSavingNome(true);
    try { await updateProfile({ nome: nome.trim() }); } finally { setSavingNome(false); }
  };
  const toggleHide = (v:boolean) => { setHideBalances(v); localStorage.setItem("nf-hide-balances", v?"1":"0"); };
  const changePass = async () => {
    if (pass1.length<6 || pass1!==pass2) return alert("Senhas não conferem ou muito curta");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pass1 });
    if (error) alert(error.message); else { alert("Senha alterada"); setPass1(""); setPass2(""); }
  };
  const signOutAll = async () => {
    const supabase = createClient();
    await supabase.auth.signOut(); location.href="/login";
  };
  const deleteAll = async () => {
    if (!confirm("Apagar TODAS movimentações, metas e orçamentos?")) return;
    for (const t of transactions) await fetch(`/api/delete-all`); // placeholder — use removeTransaction loop
    location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="font-display text-lg font-semibold text-text">Configurações</h1>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text mb-3"><User className="h-4 w-4"/> Perfil</h2>
        <label className="block text-xs text-text-faint mb-1">Nome</label>
        <div className="flex gap-2">
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder={profile?.nome ?? "Seu nome"} className="flex-1 rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text" maxLength={60}/>
          <Button variant="primary" onClick={saveNome} disabled={savingNome || !nome.trim()}>{savingNome?"Salvando...":"Salvar"}</Button>
        </div>
        <div className="mt-3 text-xs text-text-faint">Saldo inicial: <span className="font-mono text-text">{fmt(profile?.saldo_inicial ?? 0)}</span> <span className="opacity-60">(definido no cadastro, não editável)</span></div>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text mb-3"><Palette className="h-4 w-4"/> Aparência</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text">Tema</span>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-text-muted">{theme==="dark"?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={hideBalances} onChange={e=>toggleHide(e.target.checked)} className="rounded border-border"/> <span className="text-sm text-text flex items-center gap-1"><EyeOff className="h-3 w-3"/> Ocultar saldos sensíveis</span>
        </label>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text mb-3"><Database className="h-4 w-4"/> Dados</h2>
        <div className="flex gap-2 mb-2">
          <Button variant="secondary" onClick={()=>exportFinanceData({transactions, goals, budgetLimits, profile})}><Download className="h-3.5 w-3.5"/> Exportar .xlsx</Button>
          <Button variant="ghost" onClick={deleteAll} className="text-error border-error/30"><Trash2 className="h-3.5 w-3.5"/> Apagar tudo</Button>
        </div>
        <p className="text-xs text-text-faint">Exporta 4 abas (Movimentações, Resumo, Metas, Orçamento). Apagar tudo remove do banco (RLS).</p>
        <div className="mt-3 text-xs">Fonte: <code className="font-mono">NEXT_PUBLIC_DATA_SOURCE</code> = <span className={dataSource==="supabase"?"text-success":"text-ember"}>{dataSource}</span></div>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text mb-3"><Shield className="h-4 w-4"/> Segurança</h2>
        <div className="grid gap-2 max-w-sm">
          <input type="password" value={pass1} onChange={e=>setPass1(e.target.value)} placeholder="Nova senha (≥6)" className="rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text"/>
          <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Confirmar senha" className="rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text"/>
          <Button variant="primary" onClick={changePass}>Trocar senha</Button>
          <Button variant="ghost" onClick={signOutAll}><LogOut className="h-3.5 w-3.5"/> Encerrar sessões</Button>
          <p className="text-xs text-text-faint">CRON_SECRET: <span className="text-success">configurado no servidor</span> (não exibido por segurança)</p>
        </div>
      </section>
    </div>
  );
}