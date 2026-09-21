-- Nexus Flow — 0005: expiração de shares
--
-- Permite criar links temporários. Se expires_at for definido, o link
-- deixa de funcionar após esse horário (get_share_data retorna NULL).

alter table public.shares
  add column if not exists expires_at timestamptz null;

create index if not exists shares_expires_at_idx
  on public.shares (expires_at);

-- get_share_data com checagem de expiração
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

  -- Se expirou, trata como inexistente
  if s.expires_at is not null and s.expires_at <= now() then
    return null;
  end if;

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
      'expires_at', s.expires_at,
      'created_at', s.created_at
    ),
    'profile', prof,
    'transactions', coalesce(tx, '[]'::json)
  );
end;
$$;

grant execute on function public.get_share_data(uuid) to anon, authenticated;
