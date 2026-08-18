import assert from 'node:assert/strict';

const store = new Map();
const readKeys = (keys) => {
  if (keys === null) return Object.fromEntries(store);
  if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, store.get(key)]));
  if (typeof keys === 'string') return { [keys]: store.get(keys) };
  return Object.fromEntries(Object.entries(keys || {}).map(([key, fallback]) => [key, store.get(key) ?? fallback]));
};
globalThis.chrome = {
  storage: { local: { async get(keys) { return readKeys(keys); }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); }, async remove(keys) { (Array.isArray(keys) ? keys : [keys]).forEach((key) => store.delete(key)); } } }
};
store.set('aitools.auth.session', { access_token: 'test-access', refresh_token: 'test-refresh', expires_at: Date.now() + 3_600_000, user: { id: '00000000-0000-4000-8000-000000000001' } });

let mode = 'normal';
const urls = [];
globalThis.fetch = async (url, options = {}) => {
  const target = String(url); urls.push(target);
  if (mode === 'timeout') { if (options.signal?.aborted) { const error = new Error('aborted'); error.name = 'AbortError'; throw error; } return new Promise((_, reject) => options.signal?.addEventListener('abort', () => { const error = new Error('aborted'); error.name = 'AbortError'; reject(error); })); }
  if (mode === 'invalid' && target.includes('/rest/v1/tasks') && (!options.method || options.method === 'GET')) return new Response(JSON.stringify({ invalid: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (!options.method || options.method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
  return new Response('', { status: 201 });
};

const { getPersonalSyncStatus, syncPersonalData } = await import('../shared/personal-sync-service.js');
const result = await syncPersonalData();
assert.equal(result.status.state, 'success');
assert.ok(urls.some((url) => url.includes('/rest/v1/tasks') && url.includes('limit=250')));
assert.ok(urls.some((url) => url.includes('/rest/v1/reading_items') && url.includes('limit=250')));
assert.ok(urls.some((url) => url.includes('/rest/v1/workspaces') && url.includes('limit=80')));

mode = 'invalid'; urls.length = 0;
await assert.rejects(() => syncPersonalData(), /Réponse distante invalide/);
assert.equal((await getPersonalSyncStatus()).state, 'error');

const originalSetTimeout = globalThis.setTimeout; const originalClearTimeout = globalThis.clearTimeout;
globalThis.setTimeout = (callback) => { callback(); return 1; }; globalThis.clearTimeout = () => undefined; mode = 'timeout';
await assert.rejects(() => syncPersonalData(), /expiré après 12 secondes/);
globalThis.setTimeout = originalSetTimeout; globalThis.clearTimeout = originalClearTimeout;
console.log('personal-sync service simulation: ok');
