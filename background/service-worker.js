import { MESSAGE_TYPES, STORAGE_KEYS } from '../shared/constants.js';
import { getAccount, isFeatureAllowed, signInWithGoogle, signOut } from '../shared/auth-client.js';

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.notes]);
  if (!current[STORAGE_KEYS.settings]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.settings]: { theme: 'dark', notifications: true, compactMode: false, quickLinks: [] } });
  }
  if (!current[STORAGE_KEYS.notes]) await chrome.storage.local.set({ [STORAGE_KEYS.notes]: [] });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('aitools-pomodoro-')) return;
  const state = (await chrome.storage.local.get(STORAGE_KEYS.pomodoro))[STORAGE_KEYS.pomodoro];
  if (!state || state.status !== 'running') return;
  const remaining = Math.max(0, state.remaining - 1);
  const next = remaining === 0 ? { ...state, remaining: 0, status: 'done' } : { ...state, remaining };
  await chrome.storage.local.set({ [STORAGE_KEYS.pomodoro]: next });
  if (remaining === 0 && state.notifications !== false) {
    chrome.notifications.create({ type: 'basic', iconUrl: 'assets/icon-128.png', title: 'Pomodoro terminé', message: 'Votre session est terminée. Prenez quelques minutes de pause.' });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handlers = {
    'auth/get-account': () => getAccount(),
    'auth/sign-in-google': () => signInWithGoogle(),
    'auth/sign-out': () => signOut(),
    'auth/is-feature-allowed': () => isFeatureAllowed(message.feature),
    'tabs/close-duplicates': () => closeDuplicateTabs()
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: normalizeError(error) }));
  return true;
});

async function closeDuplicateTabs() {
  const tabs = await chrome.tabs.query({});
  const seen = new Set();
  const duplicateIds = [];
  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith('chrome://')) continue;
    if (seen.has(tab.url)) duplicateIds.push(tab.id);
    else seen.add(tab.url);
  }
  if (duplicateIds.length) await chrome.tabs.remove(duplicateIds);
  return { closed: duplicateIds.length };
}

function normalizeError(error) {
  const message = String(error?.message || error || 'Une erreur inattendue est survenue.');
  if (/did not approve|access_denied|cancel/i.test(message)) return 'Connexion annulée.';
  return message;
}
