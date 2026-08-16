export const STORAGE_KEYS = {
  settings: 'aitools.settings',
  notes: 'aitools.notes',
  pomodoro: 'aitools.pomodoro'
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  compactMode: false,
  quickLinks: [
    { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com', tone: 'violet' },
    { id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai', tone: 'blue' },
    { id: 'whatsapp', label: 'WhatsApp', url: 'https://web.whatsapp.com', tone: 'green' },
    { id: 'github', label: 'GitHub', url: 'https://github.com', tone: 'slate' }
  ]
};

export const MESSAGE_TYPES = {
  getPageText: 'page/get-text',
  anonymizePage: 'page/anonymize',
  summarizePage: 'page/summarize',
  pomodoroTick: 'pomodoro/tick',
  pomodoroState: 'pomodoro/state'
};

export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(patch) {
  const settings = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return settings;
}

export async function getNotes() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.notes);
  return Array.isArray(result[STORAGE_KEYS.notes]) ? result[STORAGE_KEYS.notes] : [];
}

export async function saveNotes(notes) {
  await chrome.storage.local.set({ [STORAGE_KEYS.notes]: notes });
  return notes;
}
