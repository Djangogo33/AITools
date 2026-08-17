-- AITools — profils et abonnements
-- À exécuter une seule fois dans Supabase SQL Editor avec un rôle administrateur.
-- Ne jamais exposer la clé service_role dans l’extension Chrome.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Utilisateur',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Utilisateur'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'max')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_period_idx
  on public.subscriptions (user_id, current_period_end desc);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

-- Aucune politique INSERT/UPDATE/DELETE pour le rôle authenticated.
-- Les abonnements doivent être créés ou mis à jour par un webhook serveur
-- (par exemple Stripe) utilisant une clé service_role hors de l’extension.

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;

-- Notes synchronisées : chaque utilisateur ne voit et ne modifie que ses propres notes.
create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

grant select, insert, update, delete on public.notes to authenticated;

-- Facturation Stripe : conserver les identifiants nécessaires au portail et les statuts synchronisés par webhook.
alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'expired'));

create unique index if not exists subscriptions_provider_subscription_unique
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

-- Données personnelles synchronisables étendues (optionnelles côté extension).
alter table public.notes add column if not exists tags text[] not null default '{}';
alter table public.notes add column if not exists source_url text;
alter table public.notes add column if not exists source_title text;

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 240),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  tags text[] not null default '{}',
  due_at timestamptz,
  reminder_at timestamptz,
  source_url text,
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_updated_idx on public.tasks (user_id, updated_at desc);
alter table public.tasks enable row level security;
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
grant select, insert, update, delete on public.tasks to authenticated;

create table if not exists public.reading_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null check (char_length(title) <= 180),
  tags text[] not null default '{}',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reading_items_user_updated_idx on public.reading_items (user_id, updated_at desc);
alter table public.reading_items enable row level security;
drop policy if exists "reading_items_select_own" on public.reading_items;
create policy "reading_items_select_own" on public.reading_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "reading_items_insert_own" on public.reading_items;
create policy "reading_items_insert_own" on public.reading_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "reading_items_update_own" on public.reading_items;
create policy "reading_items_update_own" on public.reading_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "reading_items_delete_own" on public.reading_items;
create policy "reading_items_delete_own" on public.reading_items for delete to authenticated using ((select auth.uid()) = user_id);
drop trigger if exists reading_items_set_updated_at on public.reading_items;
create trigger reading_items_set_updated_at before update on public.reading_items for each row execute procedure public.set_updated_at();
grant select, insert, update, delete on public.tasks, public.reading_items to authenticated;

-- Évolutions v7 : cadence des tâches, espaces de travail et préférences synchronisées.
alter table public.tasks add column if not exists recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly'));
alter table public.tasks add column if not exists recurrence_series_id uuid;

create table if not exists public.workspaces (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 120),
  tags text[] not null default '{}',
  tabs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workspaces_user_updated_idx on public.workspaces (user_id, updated_at desc);
alter table public.workspaces enable row level security;
drop policy if exists "workspaces_select_own" on public.workspaces;
create policy "workspaces_select_own" on public.workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "workspaces_insert_own" on public.workspaces;
create policy "workspaces_insert_own" on public.workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "workspaces_update_own" on public.workspaces;
create policy "workspaces_update_own" on public.workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "workspaces_delete_own" on public.workspaces;
create policy "workspaces_delete_own" on public.workspaces for delete to authenticated using ((select auth.uid()) = user_id);
drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own" on public.user_preferences for delete to authenticated using ((select auth.uid()) = user_id);
drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute procedure public.set_updated_at();
grant select, insert, update, delete on public.workspaces, public.user_preferences to authenticated;
