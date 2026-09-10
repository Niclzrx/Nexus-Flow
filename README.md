# Nexus Flow

Gerenciador financeiro pessoal. Next.js 14 (App Router) + TypeScript +
Tailwind CSS, com identidade visual "graphite & signal" herdada do Nexus
Note.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre em `http://localhost:3000`. Por padrão o app roda inteiro com dados
mockados em memória — não precisa de nenhuma credencial para começar.

## Arquitetura de dados

A ideia central deste projeto é que **nenhum componente ou hook de UI
fala diretamente com o banco**. Tudo passa por uma interface única:

```
components/, features/, app/*/page.tsx
        │
        ▼
  hooks/useTransactions, useGoals, useBudget, useCategories
        │
        ▼
  lib/providers/FinanceProvider.tsx   (contexto, carrega tudo uma vez)
        │
        ▼
  lib/repositories/index.ts           (escolhe a implementação)
        │
        ├── lib/repositories/mockRepository.ts      ← usado hoje
        └── lib/repositories/supabaseRepository.ts  ← pronto, mas inativo
```

Ambas implementações cumprem a mesma interface (`lib/repositories/types.ts`
— `FinanceRepository`). Trocar de uma para outra é uma linha de
configuração, não uma reescrita.

## Ativando o Supabase

Quando o backend estiver pronto:

1. Cria um projeto em [supabase.com](https://supabase.com).
2. Aplica a migration: `supabase/migrations/0001_init.sql` cria as
   tabelas (`transactions`, `goals`, `budget_limits`, `categories`,
   `profiles`) já com Row Level Security configurado por usuário
   (`auth.uid() = user_id`), e um trigger que cria automaticamente um
   `profile` para cada novo usuário cadastrado.
   ```bash
   supabase link --project-ref <seu-project-ref>
   supabase db push
   ```
3. Preenche `.env.local` com as credenciais do projeto (Project Settings
   → API):
   ```
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   ```
4. Reinicia o servidor. `middleware.ts` passa a renovar a sessão em cada
   navegação, e `SupabaseRepository` (já implementado em
   `lib/repositories/supabaseRepository.ts`) assume no lugar do mock.
5. Falta só a tela de login/cadastro — o schema e as policies já esperam
   um `auth.uid()` válido em cada request. `@supabase/ssr` já está
   instalado; um formulário simples de email+senha usando
   `supabase.auth.signInWithPassword` / `signUp` é o que falta plugar.

Nenhum dado mockado precisa ser migrado manualmente: os seeds em
`lib/mock-data.ts` servem só de referência para popular categorias
padrão, se quiser replicá-las como INSERT iniciais por usuário.

## Estrutura de pastas

```
app/            rotas (App Router) — uma pasta por página
components/     UI genérica (ui/) e casco do app (layout/)
features/       componentes específicos de domínio (dashboard, transactions, goals, budget, reports)
hooks/          fatias finas de useFinance() por domínio
lib/
  providers/    FinanceProvider (contexto global de dados)
  repositories/ a interface + as duas implementações (mock/Supabase)
  supabase/     clients de browser e servidor
  format.ts     helpers de formatação (moeda, data)
  mock-data.ts  seeds usados pelo mockRepository
supabase/
  migrations/   schema SQL com RLS
types/          tipos de domínio, espelhando as tabelas do banco
```

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts,
`@supabase/ssr` + `@supabase/supabase-js` (preparado, não ativo por
padrão).
