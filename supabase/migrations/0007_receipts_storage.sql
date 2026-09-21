-- Nexus Flow — 0007: anexos de comprovante em transactions
--
-- Adiciona coluna para URL do comprovante e cria bucket privado.

alter table public.transactions
  add column if not exists attachment_url text null;

-- Bucket privado para comprovantes (cria se não existir)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Policies para o bucket receipts: dono vê/edita apenas seus arquivos
-- O caminho será <user_id>/<uuid>-<filename> para isolar por usuário

-- Limpa policies antigas se re-executar
drop policy if exists "receipts: insert próprio" on storage.objects;
drop policy if exists "receipts: select próprio" on storage.objects;
drop policy if exists "receipts: update próprio" on storage.objects;
drop policy if exists "receipts: delete próprio" on storage.objects;

create policy "receipts: insert próprio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts: select próprio"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts: update próprio"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts: delete próprio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
