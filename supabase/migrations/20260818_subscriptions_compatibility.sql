-- AITools — correction de compatibilité pour une table public.subscriptions existante.
-- À exécuter dans Supabase SQL Editor si schema.sql échoue avec :
-- "column provider_subscription_id does not exist".
-- Cette migration ne supprime aucune donnée et peut être exécutée plusieurs fois.

alter table public.subscriptions add column if not exists plan text not null default 'free';
alter table public.subscriptions add column if not exists status text not null default 'active';
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists provider text;
alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists provider_subscription_id text;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'expired'));

create index if not exists subscriptions_user_period_idx
  on public.subscriptions (user_id, current_period_end desc);
create unique index if not exists subscriptions_provider_subscription_unique
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

-- Contrôle facultatif : cette requête doit renvoyer les huit colonnes attendues.
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'subscriptions'
-- order by ordinal_position;
