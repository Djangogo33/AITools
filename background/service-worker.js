import { MESSAGE_TYPES, STORAGE_KEYS } from '../shared/constants.js';
import { getAccount, isFeatureAllowed, signInWithGoogle, signOut } from '../shared/auth-client.js';
import { createNote, deleteNote, importGuestNotes, listNotes, syncNotes } from '../shared/notes-service.js';
import { createCheckout, createPortal } from '../shared/billing-client.js';

const POMODORO_ALARM = 'aitools-pomodoro-complete';
const DEFAULT_POMODORO = { status: 'idle', durationMs: 25 * 60_000, remainingMs: 25 * 60_000, endAt: null, cycle: 'focus' };

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.notes, STORAGE_KEYS.pomodoro]);
  if (!current[STORAGE_KEYS.settings]) await chrome.storage.local.set({ [STORAGE_KEYS.settings]: { theme: 'dark', notifications: true, compactMode: false, quickLinks: [] } });
  if (!current[STORAGE_KEYS.notes]) await chrome.storage.local.set({ [STORAGE_KEYS.notes]: [] });
  if (!current[STORAGE_KEYS.pomodoro]) await chrome.storage.local.set({ [STORAGE_KEYS.pomodoro]: DEFAULT_POMODORO });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== POMODORO_ALARM) return;
  const state = await getPomodoro();
  if (state.status !== 'running') return;
  const done = { ...state, status: 'done', remainingMs: 0, endAt: null };
  await savePomodoro(done);
  const settings = (await chrome.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings] || {};
  if (settings.notifications !== false) chrome.notifications.create({ type: 'basic', iconUrl: 'assets/icon-128.png', title: 'Pomodoro terminé', message: state.cycle === 'focus' ? 'Session terminée. Accordez-vous une pause.' : 'Pause terminée. Prêt pour une nouvelle session ?' });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handlers = {
    'auth/get-account': () => getAccount(),
    'auth/sign-in-google': () => signInWithGoogle(),
    'auth/sign-out': () => signOut(),
    'auth/is-feature-allowed': () => isFeatureAllowed(message.feature),
    'billing/create-checkout': () => createCheckout(message.plan),
    'billing/create-portal': () => createPortal(),
    'notes/list': () => listNotes(),
    'notes/create': () => createNote(message.content),
    'notes/delete': () => deleteNote(message.noteId),
    'notes/sync': () => syncNotes(),
    'notes/import-guest': () => importGuestNotes(),
    'pomodoro/get': () => getPomodoro(),
    'pomodoro/toggle': () => togglePomodoro(message.durationMinutes, message.cycle),
    'pomodoro/reset': () => resetPomodoro(message.durationMinutes, message.cycle),
    'tabs/close-duplicates': () => closeDuplicateTabs(),
    'tabs/group-by-domain': () => groupTabsByDomain(),
    'tabs/get-stats': () => getTabStats()
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler().then((data) => sendResponse({ ok: true, data })).catch((error) => sendResponse({ ok: false, error: normalizeError(error) }));
  return true;
});

async function getPomodoro() {
  const state = (await chrome.storage.local.get(STORAGE_KEYS.pomodoro))[STORAGE_KEYS.pomodoro] || DEFAULT_POMODORO;
  if (state.status === 'running' && state.endAt && state.endAt <= Date.now()) {
    const done = { ...state, status: 'done', remainingMs: 0, endAt: null };
    await savePomodoro(done);
    return done;
  }
  return state.status === 'running' ? { ...state, remainingMs: Math.max(0, state.endAt - Date.now()) } : state;
}

async function togglePomodoro(durationMinutes = 25, cycle = 'focus') {
  const current = await getPomodoro();
  if (current.status === 'running') {
    const paused = { ...current, status: 'paused', remainingMs: Math.max(0, current.endAt - Date.now()), endAt: null };
    await chrome.alarms.clear(POMODORO_ALARM); await savePomodoro(paused); return paused;
  }
  const isRestart = current.status === 'done' || current.cycle !== cycle || !current.remainingMs;
  const durationMs = Math.max(1, Number(durationMinutes || 25)) * 60_000;
  const remainingMs = isRestart ? durationMs : current.remainingMs;
  const running = { status: 'running', durationMs, remainingMs, endAt: Date.now() + remainingMs, cycle };
  await chrome.alarms.create(POMODORO_ALARM, { when: running.endAt }); await savePomodoro(running); return running;
}

async function resetPomodoro(durationMinutes = 25, cycle = 'focus') {
  const durationMs = Math.max(1, Number(durationMinutes || 25)) * 60_000;
  await chrome.alarms.clear(POMODORO_ALARM);
  const reset = { status: 'idle', durationMs, remainingMs: durationMs, endAt: null, cycle };
  await savePomodoro(reset); return reset;
}

async function savePomodoro(state) { await chrome.storage.local.set({ [STORAGE_KEYS.pomodoro]: state }); }

async function closeDuplicateTabs() {
  const tabs = await chrome.tabs.query({});
  const seen = new Set(); const duplicateIds = [];
  for (const tab of tabs) {
    if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.pinned) continue;
    const fingerprint = tab.url.split('#')[0];
    if (seen.has(fingerprint)) duplicateIds.push(tab.id); else seen.add(fingerprint);
  }
  if (duplicateIds.length) await chrome.tabs.remove(duplicateIds);
  return { closed: duplicateIds.length };
}

async function groupTabsByDomain() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = new Map();
  for (const tab of tabs) {
    if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.pinned) continue;
    try { const host = new URL(tab.url).hostname.replace(/^www\./, ''); groups.set(host, [...(groups.get(host) || []), tab.id]); } catch { /* URL non groupable */ }
  }
  const colors = ['blue', 'cyan', 'green', 'yellow', 'orange', 'pink', 'purple']; let count = 0;
  for (const [domain, tabIds] of groups) {
    if (tabIds.length < 2) continue;
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, { title: domain, color: colors[count % colors.length], collapsed: false }); count += 1;
  }
  return { groups: count };
}

async function getTabStats() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const unique = new Set(tabs.filter((tab) => tab.url).map((tab) => tab.url.split('#')[0]));
  return { total: tabs.length, duplicates: tabs.length - unique.size, audible: tabs.filter((tab) => tab.audible).length };
}

function normalizeError(error) {
  const message = String(error?.message || error || 'Une erreur inattendue est survenue.');
  if (/did not approve|access_denied|cancel/i.test(message)) return 'Connexion annulée.';
  return message;
}
