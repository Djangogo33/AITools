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
const userId = '00000000-0000-4000-8000-000000000001';
store.set('aitools.auth.session', { access_token: 'test-access', refresh_token: 'test-refresh', expires_at: Date.now() + 3_600_000, user: { id: userId } });
store.set('aitools.capture-inbox', [{ id: 'capture-local', content: 'Capture locale', status: 'inbox', updatedAt: '2026-08-19T10:00:00.000Z' }]);
store.set('aitools.focus-history', [{ id: 'focus-local', minutes: 25, endedAt: '2026-08-19T10:00:00.000Z' }]);
store.set('aitools.dnd-settings', { enabled: true, domains: ['example.com'] });
store.set('aitools.auth.account-cache', { forbidden: true });

let mode = 'normal';
const urls = [];
const requests = [];
globalThis.fetch = async (url, options = {}) => {
  const target = String(url); urls.push(target); requests.push({ target, options });
  if (mode === 'timeout') { if (options.signal?.aborted) { const error = new Error('aborted'); error.name = 'AbortError'; throw error; } return new Promise((_, reject) => options.signal?.addEventListener('abort', () => { const error = new Error('aborted'); error.name = 'AbortError'; reject(error); })); }
  if (mode === 'invalid' && target.includes('/rest/v1/tasks') && (!options.method || options.method === 'GET')) return new Response(JSON.stringify({ invalid: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (mode === 'restore' && target.includes('/rest/v1/user_backups') && (!options.method || options.method === 'GET')) return new Response(JSON.stringify([{ snapshot: { 'aitools.capture-inbox': [{ id: 'capture-remote', content: 'Capture distante', status: 'inbox', updatedAt: '2026-08-19T11:00:00.000Z' }], 'aitools.focus-history': [{ id: 'focus-remote', minutes: 30, endedAt: '2026-08-19T11:00:00.000Z' }], 'aitools.dnd-settings': { enabled: false, domains: ['remote.test'] }, 'aitools.search.history': ['recherche distante'] }, updated_at: '2026-08-19T11:00:00.000Z' }]), { status: 200, headers: { 'content-type': 'application/json' } });
  if (!options.method || options.method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
  return new Response('', { status: 201 });
};

const { getPersonalSyncStatus, syncPersonalData } = await import('../shared/personal-sync-service.js');
const result = await syncPersonalData();
assert.equal(result.status.state, 'success');
assert.ok(urls.some((url) => url.includes('/rest/v1/tasks') && url.includes('limit=250')));
assert.ok(urls.some((url) => url.includes('/rest/v1/reading_items') && url.includes('limit=250')));
assert.ok(urls.some((url) => url.includes('/rest/v1/workspaces') && url.includes('limit=80')));
assert.ok(urls.some((url) => url.includes('/rest/v1/notes')));
assert.ok(urls.some((url) => url.includes('/rest/v1/user_backups') && url.includes('user_id=eq.')));
assert.ok(urls.filter((url) => url.includes('limit=')).every((url) => url.includes(`user_id=eq.${userId}`)));
const backupWrite = requests.find((request) => request.target.includes('/rest/v1/user_backups?on_conflict=user_id'));
assert.ok(backupWrite, 'La sauvegarde doit être envoyée à Supabase.');
assert.equal(JSON.parse(backupWrite.options.body)[0].snapshot['aitools.auth.session'], undefined);
assert.equal(JSON.parse(backupWrite.options.body)[0].snapshot['aitools.auth.account-cache'], undefined);
assert.equal(result.backup.count, 5);

urls.length = 0; requests.length = 0;
await Promise.all([syncPersonalData(), syncPersonalData(), syncPersonalData()]);
assert.equal(urls.filter((url) => url.includes('/rest/v1/') && !url.includes('on_conflict')).length, 6);

mode = 'restore';
store.delete('aitools.capture-inbox'); store.delete('aitools.focus-history'); store.delete('aitools.dnd-settings'); store.delete('aitools.search.history');
await syncPersonalData();
assert.equal(store.get('aitools.capture-inbox')[0].id, 'capture-remote');
assert.equal(store.get('aitools.focus-history')[0].id, 'focus-remote');
assert.deepEqual(store.get('aitools.dnd-settings').domains, ['remote.test']);
assert.deepEqual(store.get('aitools.search.history'), ['recherche distante']);

mode = 'invalid'; urls.length = 0;
await assert.rejects(() => syncPersonalData(), /Réponse distante invalide/);
assert.equal((await getPersonalSyncStatus()).state, 'error');

const originalSetTimeout = globalThis.setTimeout; const originalClearTimeout = globalThis.clearTimeout;
globalThis.setTimeout = (callback) => { callback(); return 1; }; globalThis.clearTimeout = () => undefined; mode = 'timeout';
await assert.rejects(() => syncPersonalData(), /expiré après 12 secondes/);
globalThis.setTimeout = originalSetTimeout; globalThis.clearTimeout = originalClearTimeout;
console.log('personal-sync service simulation: ok');
