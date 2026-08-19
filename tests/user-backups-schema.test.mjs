import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20260819_user_backups.sql', import.meta.url), 'utf8');
for (const sql of [schema, migration]) {
  assert.match(sql, /create table if not exists public\.user_backups/i);
  assert.match(sql, /alter table public\.user_backups enable row level security/i);
  assert.match(sql, /user_backups_select_own/i);
  assert.match(sql, /user_backups_insert_own/i);
  assert.match(sql, /user_backups_update_own/i);
  assert.match(sql, /user_backups_delete_own/i);
  assert.match(sql, /grant select, insert, update, delete on public\.user_backups to authenticated/i);
}
assert.doesNotMatch(migration, /service_role/i, 'La migration client ne doit pas introduire de clé service_role.');
console.log('user backups schema simulation: ok');
