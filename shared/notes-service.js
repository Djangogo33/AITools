import { getValidSession } from './auth-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';

const LEGACY_KEY = 'aitools.notes';
const ACCOUNT_KEY_PREFIX = 'aitools.notes.account.';

export async function listNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) return readLocal(LEGACY_KEY);
  const key = `${ACCOUNT_KEY_PREFIX}${session.user.id}`;
  const local = await readLocal(key);
  try {
    const remote = await fetchNotes(session);
    const merged = mergeNotes(local, remote);
    await writeLocal(key, merged);
    return merged;
  } catch {
    return local;
  }
}

export async function createNote(content) {
  const note = { id: crypto.randomUUID(), content: String(content).trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!note.content) throw new Error('La note ne peut pas être vide.');
  const session = await getValidSession();
  const key = session?.user?.id ? `${ACCOUNT_KEY_PREFIX}${session.user.id}` : LEGACY_KEY;
  const notes = await readLocal(key);
  await writeLocal(key, [note, ...notes]);
  if (session?.user?.id) await upsertNotes(session, [note]);
  return note;
}

export async function deleteNote(noteId) {
  const session = await getValidSession();
  const key = session?.user?.id ? `${ACCOUNT_KEY_PREFIX}${session.user.id}` : LEGACY_KEY;
  const notes = await readLocal(key);
  await writeLocal(key, notes.filter((note) => note.id !== noteId));
  if (session?.user?.id) await deleteRemoteNote(session, noteId);
}

export async function syncNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous pour synchroniser vos notes.');
  const key = `${ACCOUNT_KEY_PREFIX}${session.user.id}`;
  const local = await readLocal(key);
  const remote = await fetchNotes(session);
  const merged = mergeNotes(local, remote);
  await upsertNotes(session, merged);
  await writeLocal(key, merged);
  return { count: merged.length, online: true };
}

export async function importGuestNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous avant d’importer vos notes locales.');
  const legacy = await readLocal(LEGACY_KEY);
  if (!legacy.length) return { imported: 0, total: 0 };
  const key = `${ACCOUNT_KEY_PREFIX}${session.user.id}`;
  const current = await readLocal(key);
  const merged = mergeNotes(current, legacy.map(normalizeLegacyNote));
  await upsertNotes(session, merged);
  await writeLocal(key, merged);
  return { imported: legacy.length, total: merged.length };
}

async function fetchNotes(session) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/notes`);
  endpoint.searchParams.set('select', 'id,content,created_at,updated_at');
  endpoint.searchParams.set('order', 'updated_at.desc');
  const response = await fetch(endpoint, { headers: headers(session.access_token) });
  if (!response.ok) throw await responseError(response, 'Impossible de synchroniser les notes.');
  return (await response.json()).map((note) => ({ id: note.id, content: note.content, createdAt: note.created_at, updatedAt: note.updated_at }));
}

async function upsertNotes(session, notes) {
  if (!notes.length) return;
  const payload = notes.map((note) => ({ id: note.id, user_id: session.user.id, content: note.content, created_at: note.createdAt, updated_at: note.updatedAt }));
  const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/notes?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw await responseError(response, 'Impossible d’enregistrer les notes synchronisées.');
}

async function deleteRemoteNote(session, noteId) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/notes`);
  endpoint.searchParams.set('id', `eq.${noteId}`);
  const response = await fetch(endpoint, { method: 'DELETE', headers: headers(session.access_token) });
  if (!response.ok) throw await responseError(response, 'Impossible de supprimer la note synchronisée.');
}

async function readLocal(key) {
  const result = await chrome.storage.local.get(key);
  const notes = result[key];
  return Array.isArray(notes) ? notes.map(normalizeLegacyNote) : [];
}

async function writeLocal(key, notes) { await chrome.storage.local.set({ [key]: notes }); }
function normalizeLegacyNote(note) { return { id: note.id || crypto.randomUUID(), content: String(note.content ?? note.text ?? '').trim(), createdAt: note.createdAt || new Date().toISOString(), updatedAt: note.updatedAt || note.createdAt || new Date().toISOString() }; }
function mergeNotes(first, second) { const map = new Map(); [...first, ...second].filter((note) => note?.content).forEach((note) => { const current = map.get(note.id); if (!current || new Date(note.updatedAt) >= new Date(current.updatedAt)) map.set(note.id, normalizeLegacyNote(note)); }); return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); }
function headers(accessToken) { return { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${accessToken}` }; }
async function responseError(response, fallback) { const payload = await response.json().catch(() => null); return new Error(payload?.message || payload?.msg || fallback); }
