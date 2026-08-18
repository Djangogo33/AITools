import { getValidSession } from './auth-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';
import { normalizeTags } from './tags-service.js';

const LEGACY_KEY = 'aitools.notes';
const ACCOUNT_KEY_PREFIX = 'aitools.notes.account.';
const DELETED_KEY_PREFIX = 'aitools.notes.deleted.';
const MAX_NOTE_LENGTH = 10_000;
const REQUEST_TIMEOUT_MS = 12_000;
const DELETE_CONCURRENCY = 20;

export async function listNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) return readLocal(LEGACY_KEY);
  const key = accountKey(session.user.id);
  const local = await readLocal(key);
  const deleted = await readDeleted(session.user.id);
  try {
    await flushDeletedNotes(session, deleted);
    const remote = await fetchNotes(session);
    const merged = mergeNotes(local, remote).filter((note) => !deleted.includes(note.id));
    await writeLocal(key, merged);
    return merged;
  } catch {
    return local.filter((note) => !deleted.includes(note.id));
  }
}

export async function createNote(content, details = {}) {
  const normalized = normalizeContent(content);
  if (!normalized) throw new Error('La note ne peut pas être vide.');
  if (normalized.length > MAX_NOTE_LENGTH) throw new Error(`Une note est limitée à ${MAX_NOTE_LENGTH.toLocaleString('fr-FR')} caractères.`);
  const now = new Date().toISOString();
  const note = { id: crypto.randomUUID(), content: normalized, tags: normalizeTags(details.tags), sourceUrl: normalizeHttpUrl(details.sourceUrl), sourceTitle: String(details.sourceTitle || '').trim().slice(0, 240) || null, createdAt: now, updatedAt: now };
  const session = await getValidSession();
  const key = session?.user?.id ? accountKey(session.user.id) : LEGACY_KEY;
  const notes = await readLocal(key);
  await writeLocal(key, [note, ...notes]);
  let pending = false;
  if (session?.user?.id) {
    try { await upsertNotes(session, [note]); } catch { pending = true; }
  }
  return { ...note, pending };
}

export async function deleteNote(noteId) {
  const session = await getValidSession();
  const key = session?.user?.id ? accountKey(session.user.id) : LEGACY_KEY;
  const notes = await readLocal(key);
  await writeLocal(key, notes.filter((note) => note.id !== noteId));
  if (!session?.user?.id) return { pending: false };
  try {
    await deleteRemoteNote(session, noteId);
    await removeDeletedNote(session.user.id, noteId);
    return { pending: false };
  } catch {
    await addDeletedNote(session.user.id, noteId);
    return { pending: true };
  }
}

export async function syncNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous pour synchroniser vos notes.');
  const key = accountKey(session.user.id);
  const deleted = await readDeleted(session.user.id);
  await flushDeletedNotes(session, deleted);
  const local = await readLocal(key);
  const remote = await fetchNotes(session);
  const merged = mergeNotes(local, remote).filter((note) => !deleted.includes(note.id));
  await upsertNotes(session, merged);
  await writeLocal(key, merged);
  return { count: merged.length, online: true };
}

export async function importGuestNotes() {
  const session = await getValidSession();
  if (!session?.user?.id) throw new Error('Connectez-vous avant d’importer vos notes locales.');
  const legacy = await readLocal(LEGACY_KEY);
  if (!legacy.length) return { imported: 0, total: 0 };
  const key = accountKey(session.user.id);
  const current = await readLocal(key);
  const merged = mergeNotes(current, legacy);
  await upsertNotes(session, merged);
  await writeLocal(key, merged);
  return { imported: legacy.length, total: merged.length };
}

async function fetchNotes(session) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/notes`);
  endpoint.searchParams.set('select', 'id,content,tags,source_url,source_title,created_at,updated_at');
  endpoint.searchParams.set('order', 'updated_at.desc');
  const response = await fetchWithTimeout(endpoint, { headers: headers(session.access_token) });
  if (!response.ok) throw await responseError(response, 'Impossible de synchroniser les notes.');
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error('Réponse distante des notes invalide.');
  return payload.map((note) => normalizeLegacyNote({ id: note.id, content: note.content, tags: note.tags, sourceUrl: note.source_url, sourceTitle: note.source_title, createdAt: note.created_at, updatedAt: note.updated_at }));
}

async function upsertNotes(session, notes) {
  if (!notes.length) return;
  const payload = notes.map((note) => ({ id: note.id, user_id: session.user.id, content: note.content, tags: note.tags || [], source_url: note.sourceUrl, source_title: note.sourceTitle, created_at: note.createdAt, updated_at: note.updatedAt }));
  const response = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/rest/v1/notes?on_conflict=id`, {
    method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(payload)
  });
  if (!response.ok) throw await responseError(response, 'Impossible d’enregistrer les notes synchronisées.');
}

async function deleteRemoteNote(session, noteId) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/notes`);
  endpoint.searchParams.set('id', `eq.${noteId}`);
  const response = await fetchWithTimeout(endpoint, { method: 'DELETE', headers: headers(session.access_token) });
  if (!response.ok) throw await responseError(response, 'Impossible de supprimer la note synchronisée.');
}

async function flushDeletedNotes(session, deleted) {
  if (!deleted.length) return;
  for (let index = 0; index < deleted.length; index += DELETE_CONCURRENCY) await Promise.all(deleted.slice(index, index + DELETE_CONCURRENCY).map((noteId) => deleteRemoteNote(session, noteId)));
  await writeDeleted(session.user.id, []);
}

async function readLocal(key) {
  const result = await chrome.storage.local.get(key);
  const notes = result[key];
  return Array.isArray(notes) ? notes.map(normalizeLegacyNote).filter((note) => note.content) : [];
}
async function writeLocal(key, notes) { await chrome.storage.local.set({ [key]: notes }); }
async function readDeleted(userId) { const result = await chrome.storage.local.get(deletedKey(userId)); return Array.isArray(result[deletedKey(userId)]) ? result[deletedKey(userId)] : []; }
async function writeDeleted(userId, noteIds) { await chrome.storage.local.set({ [deletedKey(userId)]: [...new Set(noteIds)] }); }
async function addDeletedNote(userId, noteId) { await writeDeleted(userId, [...await readDeleted(userId), noteId]); }
async function removeDeletedNote(userId, noteId) { await writeDeleted(userId, (await readDeleted(userId)).filter((id) => id !== noteId)); }
function accountKey(userId) { return `${ACCOUNT_KEY_PREFIX}${userId}`; }
function deletedKey(userId) { return `${DELETED_KEY_PREFIX}${userId}`; }
function normalizeContent(content) { return String(content ?? '').trim(); }
function normalizeLegacyNote(note) {
  const content = normalizeContent(note?.content ?? note?.text);
  const createdAt = validDate(note?.createdAt) ? note.createdAt : new Date().toISOString();
  const updatedAt = validDate(note?.updatedAt) ? note.updatedAt : createdAt;
  return { id: isUuid(note?.id) ? note.id : deterministicUuid(`${content}\u0000${createdAt}`), content, tags: normalizeTags(note?.tags), sourceUrl: normalizeHttpUrl(note?.sourceUrl), sourceTitle: String(note?.sourceTitle || '').trim().slice(0, 240) || null, createdAt, updatedAt };
}
function mergeNotes(first, second) {
  const map = new Map();
  [...first, ...second].filter((note) => note?.content).forEach((note) => {
    const normalized = normalizeLegacyNote(note); const current = map.get(normalized.id);
    if (!current || new Date(normalized.updatedAt) >= new Date(current.updatedAt)) map.set(normalized.id, { ...normalized, tags: normalized.tags.length ? normalized.tags : current?.tags || [], sourceUrl: normalized.sourceUrl || current?.sourceUrl || null, sourceTitle: normalized.sourceTitle || current?.sourceTitle || null });
  });
  return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}
function normalizeHttpUrl(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null; } catch { return null; } }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
function isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function deterministicUuid(value) {
  const chunks = [0x811c9dc5, 0x12345678, 0x9e3779b9, 0x85ebca6b].map((seed) => hash32(value, seed).toString(16).padStart(8, '0'));
  const hex = chunks.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4]}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
function hash32(value, seed) { let hash = seed >>> 0; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); } return hash >>> 0; }
function headers(accessToken) { return { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${accessToken}` }; }
async function fetchWithTimeout(url, options = {}) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS); try { return await fetch(url, { ...options, signal: controller.signal }); } catch (error) { if (error?.name === 'AbortError') throw new Error('La synchronisation des notes a expiré après 12 secondes.'); throw error; } finally { clearTimeout(timer); } }
async function responseError(response, fallback) { const payload = await response.json().catch(() => null); return new Error(payload?.message || payload?.msg || fallback); }
