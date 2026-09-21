-- Nexus Flow — 0003: fecha vazamento de shares + user_id automatico
--
-- (a) Remove leitura publica total de shares (qualquer anonimo listava
--     TODOS os shares de TODOS os usuarios, com user_id junto).
--     Leitura publica passa a existir SOMENTE via get_share_data().
-- (b) get_share_data respeita as flags do share e retorna colunas minimas
--     (sem user_id, sem SELECT *).
-- (c) Trigger preenche user_id = auth.uid() nos inserts e rejeita valor
--     divergente — o app nunca manda user_id (ver types/index.ts).
-- (d) handle_new_user nao quebra mais com saldo_inicial nao-numerico.

-- ---------------------------------------------------------------------
-- (a) fechar SELECT publico em shares
-- ---------------------------------------------------------------------
drop policy if exists "shares: leitura publica" on public.shares;

-- ---------------------------------------------------------------------
-- (b) get_share_data respeitando as flags
-- ---------------------------------------------------------------------
create or replace function public.get_share_data(share_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  s public.shares%rowtype;
  tx json;
  prof json;
begin
  select * into s from public.shares where id = share_id;
  if not found then
    return null;
  end if;

  -- Transacoes minimas (sem user_id/observacao) e SOMENTE se alguma
  -- secao visivel precisar delas.
  if s.show_resumo or s.show_grafico or s.show_gastos_categoria then
    select json_agg(row_to_json(t)) into tx
    from (
      select tipo, valor, categoria, data
      from public.transactions
      where user_id = s.user_id
      order by data desc
    ) t;
  else
    tx := '[]'::json;
  end if;

  -- Perfil minimo: nome sempre (exibido como "por X"); saldo_inicial
  -- somente se resumo ou grafico estiverem ligados.
  select row_to_json(p) into prof
  from (
    select
      nome,
      case
        when s.show_resumo or s.show_grafico then saldo_inicial
        else 0
      end as saldo_inicial
    from public.profiles
    where id = s.user_id
  ) p;

  return json_build_object(
    'share', json_build_object(
      'id', s.id,
      'titulo', s.titulo,
      'show_resumo', s.show_resumo,
      'show_grafico', s.show_grafico,
      'show_gastos_categoria', s.show_gastos_categoria,
      'created_at', s.created_at
    ),
    'profile', prof,
    'transactions', coalesce(tx, '[]'::json)
  );
end;
$$;

-- Compartilhar roda deslogado: a funcao precisa de EXECUTE explicito.
grant execute on function public.get_share_data(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- (c) user_id automatico nos inserts (com RLS como segunda barreira)
-- ---------------------------------------------------------------------
create or replace function public.set_own_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'user_id deve ser o proprio usuario' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists set_own_user_id on public.transactions;
create trigger set_own_user_id
  before insert on public.transactions
  for each row execute procedure public.set_own_user_id();

drop trigger if exists set_own_user_id on public.goals;
create trigger set_own_user_id
  before insert on public.goals
  for each row execute procedure public.set_own_user_id();

drop trigger if exists set_own_user_id on public.budget_limits;
create trigger set_own_user_id
  before insert on public.budget_limits
  for each row execute procedure public.set_own_user_id();

drop trigger if exists set_own_user_id on public.categories;
create trigger set_own_user_id
  before insert on public.categories
  for each row execute procedure public.set_own_user_id();

drop trigger if exists set_own_user_id on public.shares;
create trigger set_own_user_id
  before insert on public.shares
  for each row execute procedure public.set_own_user_id();

-- ---------------------------------------------------------------------
-- (d) handle_new_user tolerante a metadata invalida
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, saldo_inicial)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(
      case
        when new.raw_user_meta_data ->> 'saldo_inicial' ~ '^-?\d+(\.\d{1,2})?$'
        then (new.raw_user_meta_data ->> 'saldo_inicial')::numeric
      end,
      0
    )
  );
  return new;
end;
$$;
