export const STORAGE_KEYS = {
  settings: 'aitools.settings',
  notes: 'aitools.notes',
  pomodoro: 'aitools.pomodoro'
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  compactMode: false,
  pomodoroMinutes: 25,
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
  getReadingTime: 'page/reading-time',
  toggleFocus: 'page/toggle-focus',
  highlightSelection: 'page/highlight-selection',
  printPage: 'page/print',
  togglePageDark: 'page/toggle-dark',
  dismissCookies: 'page/dismiss-cookies',
  blockSponsored: 'page/block-sponsored',
  pomodoroTick: 'pomodoro/tick',
  pomodoroState: 'pomodoro/state'
};

export function getPomodoroMinutes(settings) {
  const value = Number(settings?.pomodoroMinutes);
  return Number.isFinite(value) ? Math.min(120, Math.max(5, Math.round(value))) : DEFAULT_SETTINGS.pomodoroMinutes;
}

export function getQuickLinks(settings) {
  const candidate = Array.isArray(settings?.quickLinks) ? settings.quickLinks : DEFAULT_SETTINGS.quickLinks;
  return candidate.flatMap((link, index) => {
    try {
      const url = new URL(link?.url);
      if (!['https:', 'http:'].includes(url.protocol)) return [];
      const label = String(link?.label || url.hostname).trim().slice(0, 24);
      if (!label) return [];
      return [{ id: String(link?.id || `link-${index}`), label, url: url.toString(), tone: ['violet', 'blue', 'green', 'slate'].includes(link?.tone) ? link.tone : 'slate' }];
    } catch { return []; }
  });
}

export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(patch) {
  const normalizedPatch = { ...patch };
  if (Object.hasOwn(normalizedPatch, 'pomodoroMinutes')) normalizedPatch.pomodoroMinutes = getPomodoroMinutes(normalizedPatch);
  const settings = { ...(await getSettings()), ...normalizedPatch };
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
