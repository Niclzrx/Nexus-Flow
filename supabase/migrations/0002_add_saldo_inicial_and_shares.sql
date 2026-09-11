-- Nexus Flow — saldo_inicial no perfil + tabela de compartilhamento

-- ---------------------------------------------------------------------
-- profiles: adicionar saldo_inicial
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists saldo_inicial numeric(12, 2) not null default 0;

-- Atualizar a funcao handle_new_user para aceitar saldo_inicial via metadados
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, saldo_inicial)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', null),
    coalesce((new.raw_user_meta_data ->> 'saldo_inicial')::numeric, 0)
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- shares — links publicos de resumo financeiro
-- ---------------------------------------------------------------------
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null default 'Meu resumo financeiro',
  show_resumo boolean not null default true,
  show_grafico boolean not null default true,
  show_gastos_categoria boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shares enable row level security;

create policy "shares: CRUD apenas do proprio usuario"
  on public.shares for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Qualquer pessoa com o link pode LER o share (sem autenticacao)
create policy "shares: leitura publica"
  on public.shares for select
  using (true);

-- ---------------------------------------------------------------------
-- Funcao para obter dados do share (bypassa RLS via security definer)
-- ---------------------------------------------------------------------
create or replace function public.get_share_data(share_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  share_record record;
  user_transactions json;
  user_profile json;
  result json;
begin
  -- Buscar o share
  SELECT * INTO share_record FROM public.shares WHERE id = share_id;
  
  IF share_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar transacoes do usuario (bypassa RLS via security definer)
  SELECT json_agg(row_to_json(t)) INTO user_transactions
  FROM (
    SELECT * FROM public.transactions 
    WHERE user_id = share_record.user_id 
    ORDER BY data DESC
  ) t;
  
  -- Buscar perfil do usuario
  SELECT row_to_json(p) INTO user_profile
  FROM (
    SELECT * FROM public.profiles WHERE id = share_record.user_id
  ) p;
  
  -- Montar resultado
  result := json_build_object(
    'share', row_to_json(share_record),
    'profile', user_profile,
    'transactions', COALESCE(user_transactions, '[]'::json)
  );
  
  RETURN result;
end;
$$;
