# Nexus Flow

Gerenciador financeiro pessoal. Next.js 14 (App Router) + TypeScript +
Tailwind CSS, com identidade visual "graphite & signal" herdada do Nexus
Note.

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
  lib/providers/FinanceProvider.tsx   (contexto, carrega tudo uma vez)
        │
        ▼
  lib/repositories/index.ts           (escolhe pela env, loga no dev)
        │
        ├── lib/repositories/mockRepository.ts      ← mock em memória
        └── lib/repositories/supabaseRepository.ts  ← Supabase (RLS)
```

Ambas cumprem `lib/repositories/types.ts` (`FinanceRepository`).

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

Modelo de segurança: anon key é pública por desenho — a proteção é o RLS
+ trigger + `GRANT EXECUTE` restrito na função de share. Service key
bypassa o RLS: uso futuro só em jobs/admin no servidor.

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

## Deploy (Render)

Sem `render.yaml`/`Dockerfile` — runtime Node nativo:

- Build Command: `npm install && npm run build` · Start: `npm start`.
- Cadastre as 4 vars acima em Environment; `SUPABASE_SERVICE_ROLE_KEY`
  (e qualquer var marcada como sensível) como **Secret**, não env comum.
- `NEXT_PUBLIC_*` exige **rebuild** (Manual Deploy) após qualquer troca.

## Estrutura de pastas

```
app/            rotas (App Router) — uma pasta por página
components/     UI genérica (ui/), auth (auth/) e casco (layout/)
features/       componentes de domínio (dashboard, transactions, goals, budget, reports)
hooks/          fatias finas de useFinance() por domínio
lib/
  providers/    FinanceProvider (contexto global de dados)
  repositories/ a interface + as duas implementações (mock/Supabase)
  supabase/     clients de browser e servidor (com fail-fast de env)
  auth-errors.ts mensagens PT para erros do Auth
  format.ts     helpers de formatação (moeda, data)
  mock-data.ts  seeds usados pelo mockRepository
supabase/
  migrations/   schema SQL com RLS (0001 → 0003)
types/          tipos de domínio, espelhando as tabelas do banco
```

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts,
`@supabase/ssr` + `@supabase/supabase-js`.
