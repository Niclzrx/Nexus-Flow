"use client";
import { useState, useEffect } from "react";
import { Sun, Moon, Download, Trash2, Shield, Palette, Database, User, LogOut, EyeOff, Eye, Info, Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useHideBalances } from "@/hooks/useHideBalances";
import { useFinance } from "@/lib/providers/FinanceProvider";
import { createClient } from "@/lib/supabase/client";
import { exportFinanceData } from "@/lib/export";
import { fmt } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const { hideBalances, setHideBalances } = useHideBalances();
  const { profile, updateProfile, transactions, goals, budgetLimits, removeTransaction, removeGoal, removeBudgetLimit } = useFinance();
  const [nome, setNome] = useState(profile?.nome ?? "");
  const [savingNome, setSavingNome] = useState(false);
  const [nomeMsg, setNomeMsg] = useState<string | null>(null);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";
  const isCloud = dataSource === "supabase";

  useEffect(() => { setNome(profile?.nome ?? ""); }, [profile?.nome]);

  const saveNome = async () => {
    const trimmed = nome.trim();
    if (!trimmed || trimmed === profile?.nome) return;
    if (trimmed.length > 60) { setNomeMsg("Nome muito longo (máx 60)"); return; }
    setSavingNome(true); setNomeMsg(null);
    try {
      await updateProfile({ nome: trimmed });
      setNomeMsg("Nome salvo ✓");
      setTimeout(() => setNomeMsg(null), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      setNomeMsg(msg);
    } finally { setSavingNome(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportFinanceData({ transactions, goals, budgetLimits, profile }); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Falha ao exportar"); }
    finally { setExporting(false); }
  };

  const handleDeleteAll = async () => {
    const total = transactions.length + goals.length + budgetLimits.length;
    if (total === 0) { alert("Nada para apagar"); return; }
    if (!confirm(`Apagar TUDO? ${transactions.length} movimentações, ${goals.length} metas, ${budgetLimits.length} orçamentos. Isso não pode ser desfeito.`)) return;
    if (!confirm("Confirmar novamente: apagar todos os seus dados?")) return;
    setDeleting(true);
    try {
      for (const t of [...transactions]) { try { await removeTransaction(t.id); } catch {} }
      for (const g of [...goals]) { try { await removeGoal(g.id); } catch {} }
      for (const b of [...budgetLimits]) { try { await removeBudgetLimit(b.id); } catch {} }
      alert("Dados apagados com sucesso");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Falha ao apagar");
    } finally { setDeleting(false); }
  };

  const changePass = async () => {
    if (pass1.length < 6 || pass1 !== pass2) { alert("Senhas não conferem ou muito curta (mín. 6)"); return; }
    if (!isCloud) { alert("Troca de senha só funciona no modo nuvem (Supabase)"); return; }
    setSavingPass(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pass1 });
      if (error) alert(error.message); else { alert("Senha alterada com sucesso"); setPass1(""); setPass2(""); }
    } finally { setSavingPass(false); }
  };

  const signOutAll = async () => {
    try { const supabase = createClient(); await supabase.auth.signOut(); } catch {}
    location.href = "/login";
  };

  const saldoDisplay = hideBalances && !revealed ? "•••••" : fmt(profile?.saldo_inicial ?? 0);

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
          <Button variant="primary" onClick={saveNome} disabled={savingNome || !nome.trim() || nome.trim() === profile?.nome}>{savingNome?"Salvando...":"Salvar"}</Button>
        </div>
        {nomeMsg && <p className={`text-xs mt-2 ${nomeMsg.includes("✓") ? "text-success" : "text-error"}`}>{nomeMsg}</p>}
        <div className="mt-4 rounded-md bg-surface-elevated border border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-text">Saldo inicial</div>
            {hideBalances && (
              <button onClick={()=>setRevealed(v=>!v)} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text">
                {revealed ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>} {revealed ? "Ocultar" : "Revelar"}
              </button>
            )}
          </div>
          <div className="font-mono text-sm text-text">{saldoDisplay}</div>
          <div className="text-xs text-text-faint mt-1">Seu ponto de partida. Usamos esse valor para calcular seu saldo atual. Foi definido quando você criou a conta e fica fixo para não bagunçar seu histórico.</div>
        </div>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Palette className="h-4 w-4"/> Aparência</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: deixe o app mais confortável para seus olhos.</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text">Tema claro ou escuro</span>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} aria-label="Alternar tema" className="h-8 w-8 rounded-md flex items-center justify-center border border-border text-text-muted hover:text-text">{theme==="dark"?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={hideBalances} onChange={e=>setHideBalances(e.target.checked)} className="rounded border-border"/> <span className="text-sm text-text flex items-center gap-1"><EyeOff className="h-3 w-3"/> Ocultar valores sensíveis</span>
        </label>
        <p className="text-xs text-text-faint mt-1">Quando ativo, esconde saldos (ex: acima e nas telas principais) até você tocar para revelar. Persiste em <code className="font-mono">localStorage</code> (<code className="font-mono">nf-hide-balances</code>).</p>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Database className="h-4 w-4"/> Dados</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: levar seus dados com você ou recomeçar do zero.</p>
        <div className="flex gap-2 mb-2">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}><Download className="h-3.5 w-3.5"/> {exporting ? "Exportando..." : "Exportar Excel"}</Button>
          <Button variant="danger" onClick={handleDeleteAll} disabled={deleting} className="border-error/30"><Trash2 className="h-3.5 w-3.5"/> {deleting ? "Apagando..." : "Apagar tudo"}</Button>
        </div>
        <p className="text-xs text-text-faint mb-3">Exporta 5 abas (Movimentações, Resumo, Totais, Metas, Orçamento). Apagar remove movimentações, metas e orçamentos do seu usuário (RLS).</p>
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
          <Button variant="primary" onClick={changePass} disabled={savingPass}>{savingPass ? "Trocando..." : "Trocar senha"}</Button>
          {!isCloud && <p className="text-xs text-ember">Modo local: troca de senha desabilitada (sem Supabase Auth).</p>}
          <Button variant="ghost" onClick={signOutAll}><LogOut className="h-3.5 w-3.5"/> Sair de todas as sessões</Button>
          <div className="rounded-md bg-success/10 border border-success/20 px-3 py-2">
            <div className="text-xs font-medium text-success">Automação diária: ativa</div>
            <div className="text-xs text-text-faint">Suas parcelas recorrentes (mensais/semanais) são verificadas e criadas automaticamente todo dia.</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg p-4 bg-surface border border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text"><Heart className="h-4 w-4"/> Sobre</h2>
        <p className="text-xs text-text-faint mb-3">Para que serve: saber o que está rodando por baixo.</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-md bg-surface-elevated border border-border px-3 py-2">
            <span className="text-text-faint">Versão</span><span className="font-mono text-text">0.1.0</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-surface-elevated border border-border px-3 py-2">
            <span className="text-text-faint">Fonte de dados</span><code className={`font-mono px-1.5 py-0.5 rounded text-xs ${isCloud ? "bg-success/10 text-success" : "bg-ember/10 text-ember"}`}>{dataSource}</code>
          </div>
          <div className="rounded-md bg-surface-elevated border border-border px-3 py-2">
            <div className="text-text font-medium">Nexus Flow</div>
            <div className="text-text-faint">Controle financeiro pessoal. Seus dados ficam isolados por usuário (RLS). Cron de recorrência roda diário via <code className="font-mono">generate_recurring_transactions()</code>.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
