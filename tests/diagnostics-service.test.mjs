import assert from 'node:assert/strict';

const store = new Map();
globalThis.chrome = { storage: { local: { async get(keys) { const list = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(list.map((key) => [key, store.get(key)])); }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); } } } };
const { createDiagnosticsExport, listDiagnostics, recordDiagnostic } = await import('../shared/diagnostics-service.js');
await recordDiagnostic('synchronisation', 'Échec sur https://example.test/private?token=secret-value', 'error');
const events = await listDiagnostics();
assert.equal(events.length, 1);
assert.equal(events[0].level, 'error');
assert.equal(events[0].message.includes('example.test'), false, 'une URL ne doit pas rester dans le journal');
assert.equal(events[0].message.includes('secret-value'), false, 'un jeton ne doit pas rester dans le journal');
const file = await createDiagnosticsExport();
assert.equal(file.filename.endsWith('.json'), true);
assert.equal(file.content.includes('example.test'), false);
console.log('diagnostics-service simulation: ok');
