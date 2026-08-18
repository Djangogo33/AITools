import { normalizeTags } from './tags-service.js';

const READING_LIST_KEY = 'aitools.reading-list';
const MAX_ITEMS = 100;

export async function listReadingItems({ tags = [] } = {}) {
  const result = await chrome.storage.local.get(READING_LIST_KEY);
  const filter = new Set(normalizeTags(tags));
  const items = Array.isArray(result[READING_LIST_KEY]) ? result[READING_LIST_KEY] : [];
  return items.map(normalizeItem).filter((item) => item.url && [...filter].every((tag) => item.tags.includes(tag))).sort((a, b) => Number(a.done) - Number(b.done) || new Date(b.createdAt) - new Date(a.createdAt));
}

export async function saveCurrentPage(details = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return saveReadingItem({ url: tab?.url, title: tab?.title, tags: details.tags, savedFrom: details.savedFrom || 'current-tab' });
}

export async function saveReadingItem(input = {}) {
  if (!input?.url || !isWebUrl(input.url)) throw new Error('Seules les pages web HTTP(S) peuvent être ajoutées à la liste de lecture.');
  const url = normalizeUrl(input.url); const title = String(input.title || new URL(url).hostname).trim().slice(0, 180);
  const item = { id: crypto.randomUUID(), url, title: title || 'Page sans titre', tags: normalizeTags(input.tags), savedFrom: String(input.savedFrom || 'manual').slice(0, 32), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), done: false };
  const items = await listReadingItems(); const existing = items.find((entry) => entry.url === item.url);
  if (existing) return { item: existing, created: false };
  await writeItems([item, ...items].slice(0, MAX_ITEMS)); return { item, created: true };
}

export async function updateReadingItem(itemId, patch = {}) {
  const items = await listReadingItems(); let updated = null;
  const next = items.map((item) => { if (item.id !== itemId) return item; updated = { ...item, title: Object.hasOwn(patch, 'title') ? String(patch.title || '').trim().slice(0, 180) || item.title : item.title, tags: Object.hasOwn(patch, 'tags') ? normalizeTags(patch.tags) : item.tags, updatedAt: new Date().toISOString() }; return updated; });
  if (!updated) throw new Error('Page introuvable.'); await writeItems(next); return updated;
}

export async function toggleReadingItem(itemId) { const items = await listReadingItems(); let toggled = null; const next = items.map((item) => { if (item.id !== itemId) return item; toggled = { ...item, done: !item.done, updatedAt: new Date().toISOString() }; return toggled; }); if (!toggled) throw new Error('Page introuvable.'); await writeItems(next); return toggled; }
export async function removeReadingItem(itemId) { const items = await listReadingItems(); const next = items.filter((item) => item.id !== itemId); await writeItems(next); return { removed: next.length !== items.length }; }

async function writeItems(items) { await chrome.storage.local.set({ [READING_LIST_KEY]: items }); }
function normalizeItem(item) { const url = normalizeUrl(item?.url); return { id: String(item?.id || crypto.randomUUID()), url, title: String(item?.title || safeTitle(url)).trim().slice(0, 180) || 'Page sans titre', tags: normalizeTags(item?.tags), savedFrom: String(item?.savedFrom || 'legacy').slice(0, 32), createdAt: validDate(item?.createdAt) ? item.createdAt : new Date().toISOString(), updatedAt: validDate(item?.updatedAt) ? item.updatedAt : validDate(item?.createdAt) ? item.createdAt : new Date().toISOString(), done: Boolean(item?.done) }; }
function normalizeUrl(value) { try { const url = new URL(String(value || '')); return isWebUrl(url.toString()) ? url.toString() : ''; } catch { return ''; } }
function isWebUrl(value) { try { const protocol = new URL(value).protocol; return protocol === 'https:' || protocol === 'http:'; } catch { return false; } }
function safeTitle(url) { try { return new URL(url).hostname; } catch { return ''; } }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
