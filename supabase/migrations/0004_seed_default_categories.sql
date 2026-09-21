-- Nexus Flow — 0004: categorias padrão para todo usuário novo + backfill
--
-- Insere as 11 categorias base (mesmas do mock) automaticamente no cadastro
-- e corrige set_own_user_id para permitir o seed via trigger interno
-- (auth.uid() é NULL dentro de handle_new_user).

-- ---------------------------------------------------------------------
-- (1) set_own_user_id tolerante a chamada interna (seed)
-- ---------------------------------------------------------------------
create or replace function public.set_own_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Seed via handle_new_user / service_role roda com auth.uid() NULL
  -- e já traz o user_id correto — não deve ser bloqueado.
  if auth.uid() is null then
    return new;
  end if;

  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'user_id deve ser o proprio usuario' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- (2) handle_new_user passa a semear as categorias padrão
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

  insert into public.categories (user_id, nome)
  values
    (new.id, 'Alimentação'),
    (new.id, 'Transporte'),
    (new.id, 'Tecnologia'),
    (new.id, 'Estudos'),
    (new.id, 'Lazer'),
    (new.id, 'Casa'),
    (new.id, 'Compras'),
    (new.id, 'Freelance'),
    (new.id, 'Salário'),
    (new.id, 'Metas'),
    (new.id, 'Outros')
  on conflict (user_id, nome) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- (3) Backfill: usuários já existentes que ainda estão com 0 categorias
-- ---------------------------------------------------------------------
insert into public.categories (user_id, nome)
select p.id, cat.nome
from public.profiles p
cross join (values
  ('Alimentação'), ('Transporte'), ('Tecnologia'), ('Estudos'), ('Lazer'),
  ('Casa'), ('Compras'), ('Freelance'), ('Salário'), ('Metas'), ('Outros')
) as cat(nome)
where not exists (
  select 1 from public.categories c where c.user_id = p.id
)
on conflict (user_id, nome) do nothing;
