import assert from 'node:assert/strict';

const store = new Map();
const calls = [];
globalThis.chrome = {
  storage: {
    local: {
      async get(keys) { const list = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(list.map((key) => [key, store.get(key)])); },
      async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); },
      async remove(keys) { (Array.isArray(keys) ? keys : [keys]).forEach((key) => store.delete(key)); }
    }
  }
};

const session = { access_token: 'access', refresh_token: 'refresh', expires_at: Date.now() + 3_600_000, user: { id: 'user-1', email: 'alex@example.com', user_metadata: {} } };
store.set('aitools.auth.session', session);

globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  if (String(url).includes('/rest/v1/notes') && !options.method) return response([{ id: 'remote-1', content: 'Note distante', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' }]);
  if (String(url).includes('/rest/v1/notes') && options.method === 'POST') return response([]);
  if (String(url).includes('/rest/v1/notes') && options.method === 'DELETE') return response([]);
  throw new Error(`Appel inattendu : ${url}`);
};
function response(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }

const { listNotes, createNote, deleteNote, importGuestNotes, syncNotes } = await import('../shared/notes-service.js');
const initial = await listNotes();
assert.equal(initial.length, 1);
assert.equal(initial[0].content, 'Note distante');
const created = await createNote('Note synchronisée');
assert.equal(created.content, 'Note synchronisée');
await deleteNote(created.id);
store.set('aitools.notes', [{ id: 'legacy-1', text: 'Note historique', createdAt: '2025-12-01T00:00:00Z' }]);
const imported = await importGuestNotes();
assert.equal(imported.imported, 1);
const synced = await syncNotes();
assert.ok(synced.count >= 1);
assert.ok(calls.some(({ options }) => options.method === 'POST'));
assert.ok(calls.some(({ options }) => options.method === 'DELETE'));
console.log('notes-service integration simulation: ok');
