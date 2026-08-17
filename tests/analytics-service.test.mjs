import assert from 'node:assert/strict';

const store = new Map();
globalThis.chrome = { storage: { local: { async get(keys) { const list = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(list.map((key) => [key, store.get(key)])); }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); }, async remove() {} } } };
const now = new Date(); const old = new Date(Date.now() - 2 * 86_400_000); const overdue = new Date(Date.now() - 3 * 86_400_000);
store.set('aitools.tasks', [{ id: crypto.randomUUID(), title: 'Terminer la synthèse', done: true, completedAt: now.toISOString(), dueAt: new Date(Date.now() - 3_600_000).toISOString() }, { id: crypto.randomUUID(), title: 'Envoyer le compte-rendu', done: false, dueAt: overdue.toISOString() }]);
store.set('aitools.reading-list', [{ id: crypto.randomUUID(), url: 'https://github.com/example/a' }, { id: crypto.randomUUID(), url: 'https://github.com/example/b' }]);
store.set('aitools.workspaces', [{ id: crypto.randomUUID(), tabs: [{ url: 'https://github.com/example/c' }, { url: 'https://developer.chrome.com/docs' }] }]);
store.set('aitools.focus-history', [{ id: crypto.randomUUID(), minutes: 25, taskTitle: 'Terminer la synthèse', endedAt: now.toISOString() }, { id: crypto.randomUUID(), minutes: 30, taskTitle: 'Terminer la synthèse', endedAt: old.toISOString() }]);
const { getWeeklyReview } = await import('../shared/analytics-service.js');
const review = await getWeeklyReview();
assert.equal(review.completedTasks, 1);
assert.equal(review.missedOpenTasks, 1);
assert.equal(review.focus.minutes, 55);
assert.equal(review.frequentDomains[0].domain, 'github.com');
assert.equal(review.frequentDomains[0].count, 3);
assert.equal(review.focusedTasks[0].label, 'Terminer la synthèse');
console.log('analytics-service simulation: ok');
