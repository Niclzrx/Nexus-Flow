-- Nexus Flow — schema inicial
-- Todas as tabelas são isoladas por usuário via Row Level Security (RLS):
-- cada linha carrega um user_id e as policies garantem que um usuário só
-- lê/grava as próprias linhas (auth.uid() = user_id).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles — um perfil por usuário autenticado (criado via trigger)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  tema text not null default 'dark' check (tema in ('dark', 'light')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: usuário vê e edita o próprio perfil"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria automaticamente um profile quando um novo usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  icone text,
  created_at timestamptz not null default now(),
  unique (user_id, nome)
);

alter table public.categories enable row level security;

create policy "categories: CRUD apenas do próprio usuário"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'gasto')),
  valor numeric(12, 2) not null check (valor > 0),
  descricao text not null,
  categoria text not null,
  data date not null,
  metodo text,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: CRUD apenas do próprio usuário"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_user_data_idx
  on public.transactions (user_id, data desc);

-- ---------------------------------------------------------------------
-- goals (metas)
-- ---------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_meta numeric(12, 2) not null check (valor_meta > 0),
  valor_guardado numeric(12, 2) not null default 0 check (valor_guardado >= 0),
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals: CRUD apenas do próprio usuário"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- budget_limits (orçamento mensal por categoria)
-- ---------------------------------------------------------------------
create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria text not null,
  limite numeric(12, 2) not null check (limite > 0),
  mes_referencia text not null, -- formato "YYYY-MM"
  unique (user_id, categoria, mes_referencia)
);

alter table public.budget_limits enable row level security;

create policy "budget_limits: CRUD apenas do próprio usuário"
  on public.budget_limits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
