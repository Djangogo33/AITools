import assert from 'node:assert/strict';
import { SUPABASE_CONFIG } from '../shared/supabase-config.js';

const tables = ['profiles', 'subscriptions', 'notes', 'tasks', 'reading_items', 'workspaces', 'user_preferences'];
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
console.log('supabase readonly health audit: ok');
