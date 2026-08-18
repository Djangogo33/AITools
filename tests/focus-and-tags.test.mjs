import assert from 'node:assert/strict';

const data = new Map();
globalThis.chrome = { storage: { local: { async get(keys) { if (keys === null) return Object.fromEntries(data); if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, data.get(key)])); if (typeof keys === 'string') return { [keys]: data.get(keys) }; return Object.fromEntries(Object.keys(keys || {}).map((key) => [key, data.get(key) ?? keys[key]])); }, async set(values) { Object.entries(values).forEach(([key, value]) => data.set(key, value)); } } } };
const { normalizeTags, matchesTags } = await import('../shared/tags-service.js');
const { domainIsMuted, getFocusStats, recordFocusSession, saveDndSettings } = await import('../shared/focus-service.js');

assert.deepEqual(normalizeTags([' Projet ', '#veille', 'projet', 'tag invalide !']), ['projet', 'veille']);
assert.equal(matchesTags({ tags: ['projet', 'veille'] }, ['projet']), true);
await recordFocusSession({ durationMs: 25 * 60_000, taskTitle: 'Écrire les tests' });
const capped = await recordFocusSession({ durationMs: 9_999 * 60_000, endedAt: new Date(Date.now() + 48 * 60 * 60_000).toISOString() });
assert.equal(capped.minutes, 720, 'une durée anormale doit être plafonnée');
assert.ok(new Date(capped.endedAt) <= new Date(Date.now() + 5 * 60_000), 'une date de fin future ne doit pas fausser les statistiques');
const stats = await getFocusStats(7);
assert.equal(stats.sessions, 2); assert.equal(stats.minutes, 745);
const dnd = await saveDndSettings({ enabled: true, domains: 'youtube.com, reddit.com, https://www.youtube.com/watch, invalide, 127.0.0.1' });
assert.equal(domainIsMuted('https://www.youtube.com/watch?v=x', dnd), true);
assert.equal(domainIsMuted('https://example.com', dnd), false);
assert.deepEqual(dnd.domains, ['youtube.com', 'reddit.com']);
console.log('focus and tags simulation: ok');
