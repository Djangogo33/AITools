import assert from 'node:assert/strict';

const store = new Map();
globalThis.chrome = { storage: { local: { async get(keys) { const list = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(list.map((key) => [key, store.get(key)])); }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); } } } };
store.set('aitools.schema-version', 6);
store.set('aitools.tasks', [{ id: crypto.randomUUID(), title: 'Tâche historique', done: false }]);
store.set('aitools.settings', { theme: 'dark' });
store.set('aitools.capture-inbox', [{ id: crypto.randomUUID(), content: 'Capture historique' }]);
const { migrateLocalData, getLocalSchemaVersion } = await import('../shared/migration-service.js');
const result = await migrateLocalData();
assert.equal(result.migrated, true);
assert.equal(await getLocalSchemaVersion(), 7);
assert.equal(store.get('aitools.tasks')[0].recurrence, 'none');
assert.equal(store.get('aitools.tasks')[0].recurrenceSeriesId, null);
assert.equal(typeof store.get('aitools.settings').updatedAt, 'string');
assert.equal(store.get('aitools.capture-inbox')[0].processedAt, null);
console.log('migration-service simulation: ok');
