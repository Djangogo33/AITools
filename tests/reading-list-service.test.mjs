import assert from 'node:assert/strict';

const store = new Map();
let activeTab = { url: 'https://example.com/article?utm_source=test', title: 'Article de test' };
globalThis.chrome = {
  storage: { local: { async get(key) { return { [key]: store.get(key) }; }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); } } },
  tabs: { async query() { return [activeTab]; } }
};
const { listReadingItems, removeReadingItem, saveCurrentPage, toggleReadingItem } = await import('../shared/reading-list-service.js');
const first = await saveCurrentPage();
assert.equal(first.created, true);
assert.equal(first.item.title, 'Article de test');
const duplicate = await saveCurrentPage();
assert.equal(duplicate.created, false);
let items = await listReadingItems();
assert.equal(items.length, 1);
const toggled = await toggleReadingItem(items[0].id);
assert.equal(toggled.done, true);
const removed = await removeReadingItem(items[0].id);
assert.equal(removed.removed, true);
assert.equal((await listReadingItems()).length, 0);
await assert.rejects(() => toggleReadingItem('page-introuvable'), /introuvable/i);
activeTab = { url: 'chrome://settings', title: 'Paramètres' };
await assert.rejects(() => saveCurrentPage(), /HTTP\(S\)/);
console.log('reading-list service simulation: ok');
