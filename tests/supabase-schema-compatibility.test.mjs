import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const recovery = await readFile(new URL('../supabase/migrations/20260818_subscriptions_compatibility.sql', import.meta.url), 'utf8');
const column = 'alter table public.subscriptions add column if not exists provider_subscription_id text;';
const index = 'create unique index if not exists subscriptions_provider_subscription_unique';
assert.ok(schema.includes(column), 'le schéma principal doit rendre provider_subscription_id rétrocompatible');
assert.ok(schema.indexOf(column) < schema.indexOf(index), 'la colonne doit être ajoutée avant l’index Stripe');
assert.ok(recovery.includes(column), 'la migration de reprise doit ajouter provider_subscription_id');
assert.ok(recovery.includes(index), 'la migration de reprise doit recréer l’index Stripe');
assert.match(recovery, /drop constraint if exists subscriptions_status_check/i);
console.log('supabase subscriptions compatibility simulation: ok');
