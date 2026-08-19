import assert from 'node:assert/strict';
import { SUPABASE_CONFIG } from '../shared/supabase-config.js';

const tables = ['profiles', 'subscriptions', 'notes', 'tasks', 'reading_items', 'workspaces', 'user_preferences'];
const backupTable = 'user_backups';
const requireBackupTable = process.env.REQUIRE_USER_BACKUPS === '1';
const headers = { apikey: SUPABASE_CONFIG.publishableKey };
const settingsResponse = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/settings`, { headers });
assert.equal(settingsResponse.status, 200, 'Les réglages Auth Supabase doivent être accessibles avec la clé publishable.');
const settings = await settingsResponse.json();
assert.equal(settings?.external?.google, true, 'Le fournisseur Google doit être activé dans Supabase.');
for (const table of tables) {
  const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?select=*&limit=1`, { headers });
  assert.equal(response.status, 200, `La table ${table} doit être exposée par la Data API.`);
  const payload = await response.json();
  assert.ok(Array.isArray(payload), `La table ${table} doit répondre sous forme de tableau.`);
  assert.equal(payload.length, 0, `Le rôle anonyme ne doit lire aucune donnée dans ${table}.`);
}
const backupResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${backupTable}?select=*&limit=1`, { headers });
if (backupResponse.status === 200) {
  const backupPayload = await backupResponse.json();
  assert.ok(Array.isArray(backupPayload), 'La table user_backups doit répondre sous forme de tableau.');
  assert.equal(backupPayload.length, 0, 'Le rôle anonyme ne doit lire aucune sauvegarde utilisateur.');
  console.log('supabase readonly health audit: ok (sauvegarde restaurable disponible)');
} else {
  if (requireBackupTable) assert.equal(backupResponse.status, 200, 'La table user_backups est requise : appliquez la migration 20260819_user_backups.sql.');
  console.log('supabase readonly health audit: ok (migration user_backups à appliquer)');
}
