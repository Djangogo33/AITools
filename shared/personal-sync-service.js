import { getValidSession } from './auth-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';

const SOURCES = {
  tasks: { localKey: 'aitools.tasks', deletedPrefix: 'aitools.tasks.deleted.', table: 'tasks', toRemote: taskToRemote, fromRemote: taskFromRemote },
  reading: { localKey: 'aitools.reading-list', deletedPrefix: 'aitools.reading.deleted.', table: 'reading_items', toRemote: readingToRemote, fromRemote: readingFromRemote }
};

export async function syncPersonalData() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous pour synchroniser vos données personnelles.');
  const outcomes = {};
  for (const type of Object.keys(SOURCES)) outcomes[type] = await syncSource(type, session);
  return outcomes;
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
  const merged = mergeById(local, remote, deleted).slice(0, 250);
  await upsertRemote(source, session, merged);
  await chrome.storage.local.set({ [source.localKey]: merged, [deletedKey]: [] });
  return { count: merged.length, deleted: deleted.length };
}

async function fetchRemote(source, session) { const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${source.table}`); endpoint.searchParams.set('select', '*'); endpoint.searchParams.set('order', 'updated_at.desc'); const response = await fetch(endpoint, { headers: headers(session.access_token) }); if (!response.ok) throw await responseError(response, 'Lecture distante impossible.'); return (await response.json()).map(source.fromRemote); }
async function upsertRemote(source, session, items) { if (!items.length) return; const payload = items.map((item) => source.toRemote(item, session.user.id)); const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${source.table}?on_conflict=id`, { method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(payload) }); if (!response.ok) throw await responseError(response, 'Enregistrement distant impossible.'); }
async function deleteRemote(table, session, id) { const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/${table}`); endpoint.searchParams.set('id', `eq.${id}`); const response = await fetch(endpoint, { method: 'DELETE', headers: headers(session.access_token) }); if (!response.ok) throw await responseError(response, 'Suppression distante impossible.'); }

function mergeById(local, remote, deleted) { const removed = new Set(deleted); const map = new Map(); [...local, ...remote].filter((item) => item?.id && !removed.has(item.id)).forEach((item) => { const current = map.get(item.id); if (!current || new Date(item.updatedAt || item.updated_at || 0) >= new Date(current.updatedAt || current.updated_at || 0)) map.set(item.id, item); }); return [...map.values()]; }
function taskToRemote(item, userId) { return { id: item.id, user_id: userId, title: item.title, priority: item.priority, tags: item.tags || [], due_at: item.dueAt, reminder_at: item.reminderAt, source_url: item.sourceUrl, done: Boolean(item.done), completed_at: item.completedAt, created_at: item.createdAt, updated_at: item.updatedAt }; }
function taskFromRemote(item) { return { id: item.id, title: item.title, priority: item.priority, tags: item.tags || [], dueAt: item.due_at, reminderAt: item.reminder_at, sourceUrl: item.source_url, done: Boolean(item.done), completedAt: item.completed_at, createdAt: item.created_at, updatedAt: item.updated_at }; }
function readingToRemote(item, userId) { return { id: item.id, user_id: userId, url: item.url, title: item.title, tags: item.tags || [], done: Boolean(item.done), created_at: item.createdAt, updated_at: item.updatedAt }; }
function readingFromRemote(item) { return { id: item.id, url: item.url, title: item.title, tags: item.tags || [], done: Boolean(item.done), createdAt: item.created_at, updatedAt: item.updated_at, savedFrom: 'supabase' }; }
function headers(accessToken) { return { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${accessToken}` }; }
async function responseError(response, fallback) { const body = await response.json().catch(() => null); return new Error(body?.message || body?.msg || fallback); }
