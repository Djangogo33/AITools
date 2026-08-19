-- AITools 8.4 : sauvegarde restaurable des données locales complémentaires.
-- À exécuter dans Supabase SQL Editor après les migrations précédentes.
-- Ne contient aucune clé secrète et ne modifie pas les tables d’authentification.

create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_backups_updated_idx on public.user_backups (updated_at desc);
alter table public.user_backups enable row level security;

drop policy if exists "user_backups_select_own" on public.user_backups;
create policy "user_backups_select_own" on public.user_backups
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "user_backups_insert_own" on public.user_backups;
create policy "user_backups_insert_own" on public.user_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "user_backups_update_own" on public.user_backups;
create policy "user_backups_update_own" on public.user_backups
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_backups_delete_own" on public.user_backups;
create policy "user_backups_delete_own" on public.user_backups
  for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists user_backups_set_updated_at on public.user_backups;
create trigger user_backups_set_updated_at
  before update on public.user_backups
  for each row execute procedure public.set_updated_at();

grant select, insert, update, delete on public.user_backups to authenticated;
