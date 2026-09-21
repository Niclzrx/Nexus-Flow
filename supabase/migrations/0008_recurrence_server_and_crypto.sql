-- Nexus Flow — 0008: recorrência server-side + base para criptografia
--
-- (a) Função server-side para gerar ocorrências faltantes de transações
--     recorrentes. Pode ser chamada por cron (pg_cron) ou pela API
--     /api/recurrence. Evita depender do client para criar as parcelas.
-- (b) Habilita pgcrypto para criptografia de campo (ex: observacao).

create extension if not exists "pgcrypto";

-- Função que gera até hoje as ocorrências faltantes
create or replace function public.generate_recurring_transactions()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  parent record;
  max_date date;
  next_date date;
  inserted int := 0;
  guard int;
begin
  for parent in
    select * from public.transactions
    where is_recurring = true and parent_id is null
  loop
    -- maior data já existente na família (parent + filhos)
    select max(data) into max_date
    from public.transactions
    where id = parent.id or parent_id = parent.id;

    next_date := case parent.recurrence_interval
      when 'weekly'  then (max_date + interval '7 days')::date
      when 'monthly' then (max_date + interval '1 month')::date
      when 'yearly'  then (max_date + interval '1 year')::date
      else null
    end;

    guard := 0;
    while next_date is not null
          and next_date <= current_date
          and guard < 24
          and (parent.recurrence_end_date is null or next_date <= parent.recurrence_end_date)
    loop
      if not exists (
        select 1 from public.transactions
        where parent_id = parent.id and data = next_date
      ) then
        insert into public.transactions (
          user_id, tipo, valor, descricao, categoria, data, metodo, observacao,
          attachment_url, is_recurring, recurrence_interval, recurrence_end_date, parent_id
        )
        values (
          parent.user_id, parent.tipo, parent.valor, parent.descricao, parent.categoria, next_date, parent.metodo, parent.observacao,
          null, false, null, null, parent.id
        );
        inserted := inserted + 1;
      end if;

      next_date := case parent.recurrence_interval
        when 'weekly'  then (next_date + interval '7 days')::date
        when 'monthly' then (next_date + interval '1 month')::date
        when 'yearly'  then (next_date + interval '1 year')::date
        else null
      end;
      guard := guard + 1;
    end loop;
  end loop;

  return inserted;
end;
$$;

-- Exemplo de helper para criptografia de campo sensível (observacao)
-- Uso: pgp_sym_encrypt('texto', current_setting('app.encryption_key'))
--      pgp_sym_decrypt(coluna::bytea, current_setting('app.encryption_key'))
-- A chave deve ser definida via Vault ou env (não commitada).
-- Para este projeto, mantemos observacao em texto claro e documentamos
-- que o Supabase já criptografa at-rest; a função acima serve como base
-- futura se precisar de criptografia por coluna.
