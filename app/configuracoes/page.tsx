"use client";
import { useState } from "react";
import { Sun, Moon, Download, Trash2, Shield, Palette, Database, User, LogOut, EyeOff, Info } from "lucide-react";
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
  const isCloud = dataSource === "supabase";

  const saveNome = async () => {
    if (!nome.trim() || nome.trim()===profile?.nome) return;
    setSavingNome(true);
    try { await updateProfile({ nome: nome.trim() }); } finally { setSavingNome(false); }
  };
  const toggleHide = (v:boolean) => { setHideBalances(v); localStorage.setItem("nf-hide-balances", v?"1":"0"); };
  const changePass = async () => {
    if (pass1.length<6 || pass1!==pass2) return alert("Senhas não conferem ou muito curta (mín. 6)");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pass1 });
    if (error) alert(error.message); else { alert("Senha alterada com sucesso"); setPass1(""); setPass2(""); }
  };
  const signOutAll = async () => { const supabase = createClient(); await supabase.auth.signOut(); location.href="/login"; };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="font-display text-lg font-semibold text-text">Configurações</h1>
      <p className="text-xs text-text-faint -mt-4">Ajuste sua conta, dados e aparência. Tudo aqui só afeta você.</p>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><User className="h-4 w-4"/> Perfil</h2>
        <p className="text-xs text-text-faint mb-3 flex items-center gap-1"><Info className="h-3 w-3"/> Para que serve: seu nome aparece nos relatórios e compartilhamentos.</p>
        <label className="block text-xs text-text-faint mb-1">Como quer ser chamado</label>
        <div className="flex gap-2">
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder={profile?.nome ?? "Ex: Nicolas"} className="flex-1 rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text" maxLength={60}/>
          <Button variant="primary" onClick={saveNome} disabled={savingNome || !nome.trim()}>{savingNome?"Salvando...":"Salvar"}</Button>
        </div>
        <div className="mt-4 rounded-md bg-surface-elevated border border-border px-3 py-2">
          <div className="text-xs font-medium text-text">Saldo inicial</div>
          <div className="font-mono text-sm text-text">{fmt(profile?.saldo_inicial ?? 0)}</div>
          <div className="text-xs text-text-faint mt-1">Seu ponto de partida. Usamos esse valor para calcular seu saldo atual. Foi definido quando você criou a conta e fica fixo para não bagunçar seu histórico.</div>
        </div>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Palette className="h-4 w-4"/> Aparência</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: deixe o app mais confortável para seus olhos.</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text">Tema claro ou escuro</span>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-text-muted">{theme==="dark"?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={hideBalances} onChange={e=>toggleHide(e.target.checked)} className="rounded border-border"/> <span className="text-sm text-text flex items-center gap-1"><EyeOff className="h-3 w-3"/> Ocultar valores sensíveis</span>
        </label>
        <p className="text-xs text-text-faint mt-1">Quando ativo, esconde saldos nas telas principais até você tocar para revelar.</p>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Database className="h-4 w-4"/> Dados</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: levar seus dados com você ou recomeçar do zero.</p>
        <div className="flex gap-2 mb-2">
          <Button variant="secondary" onClick={()=>exportFinanceData({transactions, goals, budgetLimits, profile})}><Download className="h-3.5 w-3.5"/> Exportar Excel</Button>
          <Button variant="ghost" onClick={()=>confirm("Apagar tudo?") && alert("Use a tela de movimentações para apagar em lote por enquanto")} className="text-error border-error/30"><Trash2 className="h-3.5 w-3.5"/> Apagar tudo</Button>
        </div>
        <p className="text-xs text-text-faint mb-3">Exporta 4 abas (Movimentações, Resumo, Metas, Orçamento). Apagar remove tudo do seu usuário (com RLS).</p>
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${isCloud?"bg-success/10 border-success/20 text-success":"bg-ember/10 border-ember/20 text-ember"}`}>
          {isCloud ? "☁️ Nuvem — sincronizado e seguro" : "📱 Só neste aparelho — apaga se limpar o cache"}
        </div>
        <p className="text-xs text-text-faint mt-1">{isCloud ? "Seus dados ficam salvos na nuvem e aparecem em qualquer aparelho que você logar." : "Você está no modo local, sem login. Seus dados não vão para a nuvem."}</p>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Shield className="h-4 w-4"/> Segurança</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: manter sua conta protegida.</p>
        <div className="grid gap-2 max-w-sm">
          <input type="password" value={pass1} onChange={e=>setPass1(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" className="rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text"/>
          <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Confirmar nova senha" className="rounded-md px-3 py-2 text-sm bg-surface-elevated border border-border text-text"/>
          <Button variant="primary" onClick={changePass}>Trocar senha</Button>
          <Button variant="ghost" onClick={signOutAll}><LogOut className="h-3.5 w-3.5"/> Sair de todas as sessões</Button>
          <div className="rounded-md bg-success/10 border border-success/20 px-3 py-2">
            <div className="text-xs font-medium text-success">Automação diária: ativa</div>
            <div className="text-xs text-text-faint">Suas parcelas recorrentes (mensais/semanais) são verificadas e criadas automaticamente todo dia.</div>
          </div>
        </div>
      </section>
    </div>
  );
}