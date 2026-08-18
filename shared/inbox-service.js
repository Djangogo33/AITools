import { createNote } from './notes-service.js';
import { createTask } from './tasks-service.js';
import { saveReadingItem } from './reading-list-service.js';
import { normalizeTags } from './tags-service.js';

const INBOX_KEY = 'aitools.capture-inbox';
const MAX_CAPTURES = 150;

export async function addCapture(input = {}) {
  const content = String(input.content || '').replace(/\s+/g, ' ').trim().slice(0, 10_000);
  const sourceUrl = normalizeHttpUrl(input.sourceUrl);
  if (!content && !sourceUrl) throw new Error('La capture ne contient aucun contenu exploitable.');
  const now = new Date().toISOString();
  const capture = { id: crypto.randomUUID(), content: content || String(input.sourceTitle || sourceUrl), sourceUrl, sourceTitle: String(input.sourceTitle || '').trim().slice(0, 240) || null, tags: normalizeTags(input.tags), createdAt: now, status: 'inbox' };
  const items = await listInbox({ includeProcessed: true }); await write([capture, ...items].slice(0, MAX_CAPTURES)); return capture;
}
export async function listInbox({ includeProcessed = false } = {}) { const stored = await chrome.storage.local.get(INBOX_KEY); const entries = Array.isArray(stored[INBOX_KEY]) ? stored[INBOX_KEY] : []; return entries.map(normalize).filter((item) => includeProcessed || item.status === 'inbox').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
export async function dismissCapture(captureId) { const items = await listInbox({ includeProcessed: true }); let dismissed = null; const next = items.map((item) => { if (item.id !== captureId) return item; dismissed = { ...item, status: 'dismissed', processedAt: new Date().toISOString() }; return dismissed; }); if (!dismissed) throw new Error('Capture introuvable.'); await write(next); return dismissed; }
export async function processCapture(captureId, target) {
  const items = await listInbox({ includeProcessed: true }); const capture = items.find((item) => item.id === captureId && item.status === 'inbox'); if (!capture) throw new Error('Capture introuvable ou déjà traitée.');
  let result; if (target === 'note') result = await createNote(capture.content, { tags: capture.tags, sourceUrl: capture.sourceUrl, sourceTitle: capture.sourceTitle });
  else if (target === 'task') result = await createTask(capture.sourceTitle || capture.content.slice(0, 120), 'normal', { tags: capture.tags, sourceUrl: capture.sourceUrl });
  else if (target === 'reading') result = await saveReadingItem({ url: capture.sourceUrl, title: capture.sourceTitle, tags: capture.tags, savedFrom: 'capture-inbox' });
  else throw new Error('Destination de capture inconnue.');
  const next = items.map((item) => item.id === captureId ? { ...item, status: 'processed', processedAt: new Date().toISOString(), processedAs: target } : item); await write(next); return { capture: next.find((item) => item.id === captureId), result };
}
async function write(items) { await chrome.storage.local.set({ [INBOX_KEY]: items }); }
function normalize(item) { return { id: String(item?.id || crypto.randomUUID()), content: String(item?.content || '').trim().slice(0, 10_000), sourceUrl: normalizeHttpUrl(item?.sourceUrl), sourceTitle: String(item?.sourceTitle || '').trim().slice(0, 240) || null, tags: normalizeTags(item?.tags), createdAt: validDate(item?.createdAt) ? item.createdAt : new Date().toISOString(), status: ['inbox', 'processed', 'dismissed'].includes(item?.status) ? item.status : 'inbox', processedAt: validDate(item?.processedAt) ? item.processedAt : null, processedAs: String(item?.processedAs || '') || null }; }
function normalizeHttpUrl(value) { try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null; } catch { return null; } }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
