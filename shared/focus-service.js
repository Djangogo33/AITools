const HISTORY_KEY = 'aitools.focus-history';
const DND_KEY = 'aitools.dnd-settings';
const MAX_SESSIONS = 2_000;
const MAX_SESSION_MINUTES = 12 * 60;

export async function recordFocusSession({ durationMs, taskId = null, taskTitle = null, endedAt = new Date().toISOString() }) {
  const minutes = normalizeMinutes(Number(durationMs || 0) / 60_000);
  const session = { id: crypto.randomUUID(), minutes, taskId: typeof taskId === 'string' ? taskId : null, taskTitle: String(taskTitle || '').trim().slice(0, 240) || null, endedAt: normalizeEndedAt(endedAt) };
  const history = await listFocusSessions(); await chrome.storage.local.set({ [HISTORY_KEY]: [session, ...history].slice(0, MAX_SESSIONS) }); return session;
}

export async function listFocusSessions() { const result = await chrome.storage.local.get(HISTORY_KEY); return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY].filter((item) => validDate(item?.endedAt) && Number(item?.minutes) > 0).map(normalizeSession) : []; }
export async function getFocusStats(days = 7) { const amount = Math.max(1, Math.min(365, Number(days) || 7)); const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (amount - 1)); const sessions = (await listFocusSessions()).filter((item) => new Date(item.endedAt) >= start); const minutes = sessions.reduce((total, item) => total + item.minutes, 0); const byDay = Array.from({ length: amount }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = date.toISOString().slice(0, 10); return { date: key, minutes: sessions.filter((item) => item.endedAt.slice(0, 10) === key).reduce((total, item) => total + item.minutes, 0) }; }); return { days: amount, sessions: sessions.length, minutes, averageMinutes: sessions.length ? Math.round(minutes / sessions.length) : 0, byDay }; }

export async function getDndSettings() { const result = await chrome.storage.local.get(DND_KEY); const source = result[DND_KEY] || {}; return { enabled: Boolean(source.enabled), domains: normalizeDomains(source.domains) }; }
export async function saveDndSettings(patch = {}) { const current = await getDndSettings(); const next = { enabled: Object.hasOwn(patch, 'enabled') ? Boolean(patch.enabled) : current.enabled, domains: Object.hasOwn(patch, 'domains') ? normalizeDomains(patch.domains) : current.domains }; await chrome.storage.local.set({ [DND_KEY]: next }); return next; }
export function domainIsMuted(url, settings) { try { const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); return settings.enabled && settings.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)); } catch { return false; } }

function normalizeSession(value) { return { id: String(value?.id || crypto.randomUUID()), minutes: normalizeMinutes(value?.minutes), taskId: typeof value?.taskId === 'string' ? value.taskId : null, taskTitle: String(value?.taskTitle || '').trim().slice(0, 240) || null, endedAt: normalizeEndedAt(value?.endedAt) }; }
function normalizeMinutes(value) { return Math.max(1, Math.min(MAX_SESSION_MINUTES, Math.round(Number(value) || 1))); }
function normalizeEndedAt(value) { const now = new Date(); const date = validDate(value) ? new Date(value) : now; return (date > new Date(now.getTime() + 5 * 60_000) ? now : date).toISOString(); }
function normalizeDomains(value) { const source = Array.isArray(value) ? value : String(value || '').split(/[;,\s]+/); return [...new Set(source.map((item) => String(item || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).filter((item) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(item)))].slice(0, 80); }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
