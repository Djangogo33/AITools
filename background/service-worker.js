import { MESSAGE_TYPES, STORAGE_KEYS } from '../shared/constants.js';

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.notes]);
  if (!current[STORAGE_KEYS.settings]) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.settings]: {
        theme: 'dark',
        notifications: true,
        compactMode: false,
        quickLinks: []
      }
    });
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
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Pomodoro terminé',
      message: 'Votre session est terminée. Prenez quelques minutes de pause.'
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPES.pomodoroState) {
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === 'tabs/close-duplicates') {
    closeDuplicateTabs().then((closed) => sendResponse({ ok: true, closed }));
    return true;
  }
  return false;
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
  return duplicateIds.length;
}
