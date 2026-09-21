# Nexus Flow

Gerenciador financeiro pessoal. Next.js 14 (App Router) + TypeScript +
Tailwind CSS, com identidade visual "graphite & signal" herdada do Nexus
Note. Landing pública em `/` com botão de login, dashboard protegido por
`middleware.ts`.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # e preencha (ver abaixo)
npm run dev
```

Abre em `http://localhost:3000`.

Por padrão (`NEXT_PUBLIC_DATA_SOURCE=mock` ou sem `.env.local`), o app roda
com dados mockados em memória — bom para desenvolver UI sem backend. Com
`NEXT_PUBLIC_DATA_SOURCE=supabase` + credenciais, usa o Supabase.

> `NEXT_PUBLIC_*` é embutido no build: depois de criar ou trocar o
> `.env.local`, **reinicie o `npm run dev`**.

## Variáveis de ambiente

| Var | Onde | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` ou `supabase` | Chaveia o repositório |
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Project Settings → API | Pública (vai no bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem (formato `sb_publishable_…`) | Pública; o cerco é o RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem (formato `sb_secret_…`) | **Secreta**: só servidor, nunca com prefixo `NEXT_PUBLIC_`, nunca no git (`.env.local` está no `.gitignore`) |
| `CRON_SECRET` | Gerado por você (ex: `openssl rand -hex 32`) | Protege `POST /api/recurrence` para cron de recorrência |

## Arquitetura de dados

Nenhum componente ou hook de UI fala diretamente com o banco. Tudo passa
por uma interface única:

```
components/, features/, app/*/page.tsx
        │
        ▼
  hooks/useTransactions, useGoals, useBudget, useCategories
        │
        ▼
  lib/providers/FinanceProvider.tsx   (contexto, carrega tudo uma vez, gera recorrências faltantes até hoje)
        │
        ▼
  lib/repositories/index.ts           (escolhe pela env, loga no dev)
        │
        ├── lib/repositories/mockRepository.ts      ← mock em memória
        └── lib/repositories/supabaseRepository.ts  ← Supabase (RLS + Zod)
```

Ambas cumprem `lib/repositories/types.ts` (`FinanceRepository`) e
`lib/validators.ts` (Zod) impede mass assignment e valores absurdos.

## Banco (Supabase)

Migrations em `supabase/migrations/`, aplicar em ordem no SQL Editor
(não há CLI linkado neste repo):

- `0001_init.sql` — tabelas (`transactions`, `goals`, `budget_limits`,
  `categories`, `profiles`) com RLS por usuário (`auth.uid() = user_id`) e
  trigger que cria o `profile` no cadastro.
- `0002_add_saldo_inicial_and_shares.sql` — `saldo_inicial` + tabela
  `shares` e função `get_share_data()`.
- `0003_security_shares_and_userid.sql` — fecha leitura pública de
  `shares` (só via `get_share_data`, que respeita as flags e retorna
  colunas mínimas), trigger `set_own_user_id` nos inserts das 5 tabelas
  (o app nunca envia `user_id`) e `handle_new_user` tolerante a metadata
  inválida.
- `0004_seed_default_categories.sql` — corrige `set_own_user_id` para `auth.uid() IS NULL` (seed interno) e semeia 11 categorias padrão (Alimentação, Transporte, Tecnologia, Estudos, Lazer, Casa, Compras, Freelance, Salário, Metas, Outros) no cadastro + backfill.
- `0005_share_expiration.sql` — coluna `shares.expires_at` + `get_share_data` retorna `NULL` se expirado.
- `0006_recurring_transactions.sql` — `transactions.is_recurring`, `recurrence_interval` (weekly/monthly/yearly), `recurrence_end_date`, `parent_id` + índices.
- `0007_receipts_storage.sql` — coluna `transactions.attachment_url` + bucket privado `receipts` com policies `auth.uid()::text = foldername(name)[1]`.
- `0008_recurrence_server_and_crypto.sql` — `generate_recurring_transactions()` server-side (para cron) + `pgcrypto` habilitado como base para criptografia por coluna.

Modelo de segurança: anon key é pública por desenho — a proteção é o RLS
+ trigger + `GRANT EXECUTE` restrito na função de share. Service key
bypassa o RLS: usada só em `lib/supabase/server.ts` e `app/api/recurrence`.

## Funcionalidades

- **Landing + Auth:** `/` pública (deslogado vê landing, logado vê dashboard), `/login`, `/cadastro`, `/compartilhar/[id]` públicas; demais rotas exigem login (`middleware.ts`). `AuthForm` com honeypot + delay 800ms anti-bot, `friendlyAuthError` PT.
- **Transações:** CRUD com `is_recurring` (weekly/monthly/yearly) e geração automática até hoje (`lib/recurrence.ts` + `FinanceProvider`), `attachment_url` via Storage `receipts` (upload até 5 MB em `TransactionForm`), filtros avançados em `app/movimentacoes` (período, faixa de valor, busca em descrição/observação/categoria).
- **Orçamento:** `app/orcamento` filtra gastos do mês atual, barras por categoria e banner de alerta quando ≥85% ou ≥100%.
- **Shares:** `ShareForm` com expiração (Nunca/1h/24h/7d) + flags `show_*`; `get_share_data` respeita expiração.
- **Categorias/Metas/Relatórios:** 11 categorias padrão no cadastro.

## Segurança (checklist 1-20)

| # | Item | Status |
|---|------|--------|
| 1 | Esconder API Keys | `NEXT_PUBLIC_*` no bundle (inevitável), `SERVICE_ROLE` só server (`lib/supabase/server.ts`, `app/api/recurrence`) |
| 2 | Limpar secrets do git | `.env.local` ignorado (`.gitignore:4-5`), histórico verificado (`git log -p --all` limpo) |
| 3 | Public Key DB | Anon é pública por desenho; service_role nunca exposta |
| 4 | Ativar RLS | Todas as 5 tabelas + `storage.objects` com `using/with check (auth.uid()=user_id)` |
| 5 | Criptografia | Supabase at-rest + `pgcrypto` habilitado (`0008`) para futuro `pgp_sym_encrypt` por coluna |
| 6 | Auth Server side | `lib/supabase/server.ts` fail-fast + `middleware.ts` renova sessão |
| 7 | Restringir acessos | Policies por `user_id` + `set_own_user_id` trigger |
| 8 | Bloquear Mass Assignment | `lib/validators.ts` (Zod) com `strip` + `strict` |
| 9 | Proteger cookies | `server.ts:25-32` e `middleware.ts:31-50` forçam `httpOnly`, `secure` em prod, `sameSite=lax` |
| 10 | Hash nas senhas | Supabase Auth (bcrypt) — nunca logamos senha |
| 11 | Rate limit | `middleware.ts:15-35` (20 req/60s por IP em `/login|/cadastro|/compartilhar`) |
| 12 | Bot protection | Honeypot + delay em `AuthForm.tsx:15-30` |
| 13 | Queries parametrizadas | Só `supabase.from().eq().insert(obj)` — sem SQL cru |
| 14 | Validação dos Inputs | Zod em `supabaseRepository` para `transactions/goals/budget/shares/categories/profile` |
| 15 | Vazar conteúdo | `0003` trim de `get_share_data` (sem `SELECT *`, sem `user_id`) |
| 16 | Restringir uploads | `0007` bucket `receipts` com `foldername` + `TransactionForm` valida `contentType` e 5 MB |
| 17 | Trim resposta de API | `get_share_data` retorna só colunas mínimas |
| 18 | Add security headers | `next.config.mjs:2-41` (`HSTS`, `X-Frame-Options`, `CSP`, etc) |
| 19 | Forçar HTTPS | `middleware.ts:15-22` redirect 308 + `HSTS` |
| 20 | Scan de dependências | `npm audit` — `next@14.2.35` precisa major bump para `16.3.5` (documentado), `xlsx` só para export (sem parse), `postcss` via `next` |

## Auth

Email + senha (`app/login`, `app/cadastro`, `middleware.ts` renova a
sessão e protege rotas; `/`, `/login`, `/cadastro` e `/compartilhar/*` são
públicas — `/` mostra a landing para deslogados e o dashboard para
logados; `AppShell` só monta provider/sidebar com sessão). Detalhes que pegam:

- Com **"Confirm email" ligado** (padrão do Supabase), o cadastro **não**
  cria sessão: o app mostra "verifique seu email" e o login só funciona
  após o clique no link. Para pular a confirmação em dev, desligue em
  Authentication → Providers → Email.
- Erros comuns são traduzidos em `lib/auth-errors.ts` (rate limit,
  email não confirmado, credenciais inválidas).
- Env de teste excedeu rate limit de signup? Aguarde alguns minutos
  (limite do plano free).

## Recorrência server-side

Além da geração client em `FinanceProvider`, há `POST /api/recurrence`
(protegida por `CRON_SECRET`) que chama `generate_recurring_transactions()`
via `service_role`. Configure um cron (Vercel Cron, Render Cron ou `pg_cron`)
para `POST https://seu-app/api/recurrence` com header `x-cron-secret: $CRON_SECRET`
diariamente.

## Deploy (Render)

Sem `render.yaml`/`Dockerfile` — runtime Node nativo:

- Build Command: `npm install && npm run build` · Start: `npm start`.
- Cadastre as 5 vars acima em Environment; `SUPABASE_SERVICE_ROLE_KEY`
  e `CRON_SECRET` (e qualquer var marcada como sensível) como **Secret**, não env comum.
- `NEXT_PUBLIC_*` exige **rebuild** (Manual Deploy) após qualquer troca.

## Estrutura de pastas

```
app/            rotas (App Router) — uma pasta por página + api/recurrence
components/     UI genérica (ui/), auth (auth/), landing (landing/) e casco (layout/)
features/       componentes de domínio (dashboard, transactions, goals, budget, reports, share, categories, export)
hooks/          fatias finas de useFinance() por domínio + useSession
lib/
  providers/    FinanceProvider (contexto global + recorrência)
  repositories/ a interface + as duas implementações (mock/Supabase)
  supabase/     clients de browser e servidor (com fail-fast de env)
  validators.ts Zod schemas (mass assignment + tamanho)
  recurrence.ts helpers de recorrência
  auth-errors.ts mensagens PT para erros do Auth
  format.ts     helpers de formatação (moeda, data)
  mock-data.ts  seeds usados pelo mockRepository
supabase/
  migrations/   schema SQL com RLS (0001 → 0008)
types/          tipos de domínio, espelhando as tabelas do banco
```

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts,
`@supabase/ssr` + `@supabase/supabase-js`, `zod`, `xlsx` (export).
