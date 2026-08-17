import assert from 'node:assert/strict';

const store = new Map();
globalThis.chrome = { storage: { local: { async get(key) { return { [key]: store.get(key) }; }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); } } } };
const { getPomodoroMinutes, getQuickLinks, getSettings, saveSettings } = await import('../shared/constants.js');
assert.equal(getPomodoroMinutes({ pomodoroMinutes: 2 }), 5);
assert.equal(getPomodoroMinutes({ pomodoroMinutes: 150 }), 120);
assert.equal(getPomodoroMinutes({ pomodoroMinutes: 34.7 }), 35);
assert.equal(getQuickLinks({ quickLinks: [] }).length, 0);
assert.equal(getQuickLinks({ quickLinks: [{ label: 'Invalide', url: 'javascript:alert(1)' }] }).length, 0);
await saveSettings({ pomodoroMinutes: 200, quickLinks: [] });
const settings = await getSettings();
assert.equal(settings.pomodoroMinutes, 120);
assert.deepEqual(settings.quickLinks, []);
console.log('constants preferences simulation: ok');
