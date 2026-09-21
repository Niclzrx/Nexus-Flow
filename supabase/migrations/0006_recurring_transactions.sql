-- Nexus Flow — 0006: transações recorrentes
--
-- Marca transações como recorrentes e permite geração automática
-- das próximas ocorrências. As colunas são opcionais para não afetar
-- dados existentes.

alter table public.transactions
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_interval text
    check (recurrence_interval in ('weekly', 'monthly', 'yearly')),
  add column if not exists recurrence_end_date date null,
  add column if not exists parent_id uuid references public.transactions(id) on delete set null;

create index if not exists transactions_recurring_idx
  on public.transactions (user_id, is_recurring)
  where is_recurring = true;

create index if not exists transactions_parent_id_idx
  on public.transactions (parent_id)
  where parent_id is not null;
