import { getValidSession } from './auth-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';
import { recordDiagnostic } from './diagnostics-service.js';

const SYNC_STATUS_KEY = 'aitools.personal-sync-status';
const SOURCES = {
  tasks: { localKey: 'aitools.tasks', deletedPrefix: 'aitools.tasks.deleted.', table: 'tasks', max: 250, toRemote: taskToRemote, fromRemote: taskFromRemote },
  reading: { localKey: 'aitools.reading-list', deletedPrefix: 'aitools.reading.deleted.', table: 'reading_items', max: 250, toRemote: readingToRemote, fromRemote: readingFromRemote },
  workspaces: { localKey: 'aitools.workspaces', deletedPrefix: 'aitools.workspaces.deleted.', table: 'workspaces', max: 80, toRemote: workspaceToRemote, fromRemote: workspaceFromRemote }
};

export async function syncPersonalData() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous pour synchroniser vos données personnelles.');
  const outcomes = {};
  try {
    for (const type of Object.keys(SOURCES)) outcomes[type] = await syncSource(type, session);
    outcomes.preferences = await syncPreferences(session);
    const status = { state: 'success', syncedAt: new Date().toISOString(), summary: Object.fromEntries(Object.entries(outcomes).map(([type, data]) => [type, data.count ?? 1])) };
    await chrome.storage.local.set({ [SYNC_STATUS_KEY]: status });
    await recordDiagnostic('synchronisation', `Synchronisation réussie : ${outcomes.tasks.count} tâches, ${outcomes.reading.count} pages et ${outcomes.workspaces.count} espaces.`, 'info');
    return { ...outcomes, status };
  } catch (error) {
    const previous = (await chrome.storage.local.get(SYNC_STATUS_KEY))[SYNC_STATUS_KEY] || {};
    const message = String(error?.message || error).slice(0, 240);
    await chrome.storage.local.set({ [SYNC_STATUS_KEY]: { ...previous, state: 'error', attemptedAt: new Date().toISOString(), error: message } });
    await recordDiagnostic('synchronisation', message, 'error');
    throw error;
  }
}

export async function getPersonalSyncStatus() {
  return (await chrome.storage.local.get(SYNC_STATUS_KEY))[SYNC_STATUS_KEY] || { state: 'idle', syncedAt: null };
}

export async function markPersonalDeleted(type, itemId) {
  const session = await getValidSession();
  const source = SOURCES[type];
  if (!session?.user?.id || !source || !itemId) return { pending: false };
  const key = `${source.deletedPrefix}${session.user.id}`; const current = (await chrome.storage.local.get(key))[key];
  await chrome.storage.local.set({ [key]: [...new Set([...(Array.isArray(current) ? current : []), itemId])] });
  return { pending: true };
}

async function syncSource(type, session) {
  const source = SOURCES[type]; const deletedKey = `${source.deletedPrefix}${session.user.id}`;
  const stored = await chrome.storage.local.get([source.localKey, deletedKey]);
  const local = Array.isArray(stored[source.localKey]) ? stored[source.localKey] : [];
  const deleted = Array.isArray(stored[deletedKey]) ? stored[deletedKey] : [];
  for (const id of deleted) await deleteRemote(source.table, session, id);
  const remote = await fetchRemote(source, session);
  const merged = mergeById(local, remote, deleted).slice(0, source.max);
  await upsertRemote(source, session, merged);
  await chrome.storage.local.set({ [source.localKey]: merged, [deletedKey]: [] });
  return { count: merged.length, deleted: deleted.length };
}

async function syncPreferences(session) {
  const settingsKey = 'aitools.settings'; const stored = await chrome.storage.local.get(settingsKey); const local = stored[settingsKey] && typeof stored[settingsKey] === 'object' ? stored[settingsKey] : null;
  const remote = await fetchRemotePreference(session);
  const localUpdatedAt = new Date(local?.updatedAt || 0); const remoteUpdatedAt = new Date(remote?.updatedAt || 0);
  const useRemote = remote?.settings && (!local || remoteUpdatedAt >= localUpdatedAt);
  const settings = { ...(useRemote ? remote.settings : local || {}), updatedAt: (useRemote ? remote.updatedAt : local?.updatedAt) || new Date().toISOString() };
  await upsertRemotePreference(session, settings);
  await chrome.storage.local.set({ [settingsKey]: settings });
  return { count: 1, direction: useRemote ? 'remote' : 'local' };
}

async function fetchRemote(source, session) { const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${source.table}`); endpoint.searchParams.set('select', '*'); endpoint.searchParams.set('order', 'updated_at.desc'); const response = await fetch(endpoint, { headers: headers(session.access_token) }); if (!response.ok) throw await responseError(response, 'Lecture distante impossible.'); return (await response.json()).map(source.fromRemote); }
async function upsertRemote(source, session, items) { if (!items.length) return; const payload = items.map((item) => source.toRemote(item, session.user.id)); const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${source.table}?on_conflict=id`, { method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(payload) }); if (!response.ok) throw await responseError(response, 'Enregistrement distant impossible.'); }
async function deleteRemote(table, session, id) { const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${table}`); endpoint.searchParams.set('id', `eq.${id}`); const response = await fetch(endpoint, { method: 'DELETE', headers: headers(session.access_token) }); if (!response.ok) throw await responseError(response, 'Suppression distante impossible.'); }
async function fetchRemotePreference(session) { const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/user_preferences`); endpoint.searchParams.set('select', 'settings,updated_at'); endpoint.searchParams.set('limit', '1'); const response = await fetch(endpoint, { headers: headers(session.access_token) }); if (!response.ok) throw await responseError(response, 'Lecture des préférences distante impossible.'); const [item] = await response.json(); return item ? { settings: item.settings, updatedAt: item.updated_at } : null; }
async function upsertRemotePreference(session, settings) { const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_preferences?on_conflict=user_id`, { method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ user_id: session.user.id, settings, updated_at: settings.updatedAt }]) }); if (!response.ok) throw await responseError(response, 'Enregistrement des préférences distant impossible.'); }

function mergeById(local, remote, deleted) { const removed = new Set(deleted); const map = new Map(); [...local, ...remote].filter((item) => item?.id && !removed.has(item.id)).forEach((item) => { const current = map.get(item.id); if (!current || new Date(item.updatedAt || item.updated_at || 0) >= new Date(current.updatedAt || current.updated_at || 0)) map.set(item.id, item); }); return [...map.values()]; }
function taskToRemote(item, userId) { return { id: item.id, user_id: userId, title: item.title, priority: item.priority, tags: item.tags || [], due_at: item.dueAt, reminder_at: item.reminderAt, recurrence: item.recurrence || 'none', recurrence_series_id: item.recurrenceSeriesId, source_url: item.sourceUrl, done: Boolean(item.done), completed_at: item.completedAt, created_at: item.createdAt, updated_at: item.updatedAt }; }
function taskFromRemote(item) { return { id: item.id, title: item.title, priority: item.priority, tags: item.tags || [], dueAt: item.due_at, reminderAt: item.reminder_at, recurrence: item.recurrence || 'none', recurrenceSeriesId: item.recurrence_series_id, sourceUrl: item.source_url, done: Boolean(item.done), completedAt: item.completed_at, createdAt: item.created_at, updatedAt: item.updated_at }; }
function readingToRemote(item, userId) { return { id: item.id, user_id: userId, url: item.url, title: item.title, tags: item.tags || [], done: Boolean(item.done), created_at: item.createdAt, updated_at: item.updatedAt }; }
function readingFromRemote(item) { return { id: item.id, url: item.url, title: item.title, tags: item.tags || [], done: Boolean(item.done), createdAt: item.created_at, updatedAt: item.updated_at, savedFrom: 'supabase' }; }
function workspaceToRemote(item, userId) { return { id: item.id, user_id: userId, name: item.name, tags: item.tags || [], tabs: item.tabs || [], created_at: item.createdAt, updated_at: item.updatedAt }; }
function workspaceFromRemote(item) { return { id: item.id, name: item.name, tags: item.tags || [], tabs: item.tabs || [], createdAt: item.created_at, updatedAt: item.updated_at }; }
function headers(accessToken) { return { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${accessToken}` }; }
async function responseError(response, fallback) { const body = await response.json().catch(() => null); return new Error(body?.message || body?.msg || fallback); }
