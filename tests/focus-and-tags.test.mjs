import assert from 'node:assert/strict';

const data = new Map();
globalThis.chrome = { storage: { local: { async get(keys) { if (keys === null) return Object.fromEntries(data); if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, data.get(key)])); if (typeof keys === 'string') return { [keys]: data.get(keys) }; return Object.fromEntries(Object.keys(keys || {}).map((key) => [key, data.get(key) ?? keys[key]])); }, async set(values) { Object.entries(values).forEach(([key, value]) => data.set(key, value)); } } } };
const { normalizeTags, matchesTags } = await import('../shared/tags-service.js');
const { domainIsMuted, getFocusStats, recordFocusSession, saveDndSettings } = await import('../shared/focus-service.js');

assert.deepEqual(normalizeTags([' Projet ', '#veille', 'projet', 'tag invalide !']), ['projet', 'veille']);
assert.equal(matchesTags({ tags: ['projet', 'veille'] }, ['projet']), true);
await recordFocusSession({ durationMs: 25 * 60_000, taskTitle: 'Écrire les tests' });
const stats = await getFocusStats(7);
assert.equal(stats.sessions, 1); assert.equal(stats.minutes, 25);
const dnd = await saveDndSettings({ enabled: true, domains: 'youtube.com, reddit.com' });
assert.equal(domainIsMuted('https://www.youtube.com/watch?v=x', dnd), true);
assert.equal(domainIsMuted('https://example.com', dnd), false);
console.log('focus and tags simulation: ok');
