const READING_LIST_KEY = 'aitools.reading-list';
const MAX_ITEMS = 100;

export async function listReadingItems() {
  const result = await chrome.storage.local.get(READING_LIST_KEY);
  const items = Array.isArray(result[READING_LIST_KEY]) ? result[READING_LIST_KEY] : [];
  return items.map(normalizeItem).filter((item) => item.url).sort((a, b) => Number(a.done) - Number(b.done) || new Date(b.createdAt) - new Date(a.createdAt));
}

export async function saveCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !isWebUrl(tab.url)) throw new Error('Seules les pages web HTTP(S) peuvent être ajoutées à la liste de lecture.');
  const title = String(tab.title || new URL(tab.url).hostname).trim().slice(0, 180);
  const item = { id: crypto.randomUUID(), url: normalizeUrl(tab.url), title: title || 'Page sans titre', createdAt: new Date().toISOString(), done: false };
  const items = await listReadingItems();
  const existing = items.find((entry) => entry.url === item.url);
  if (existing) return { item: existing, created: false };
  const next = [item, ...items].slice(0, MAX_ITEMS);
  await writeItems(next);
  return { item, created: true };
}

export async function toggleReadingItem(itemId) {
  const items = await listReadingItems();
  const next = items.map((item) => item.id === itemId ? { ...item, done: !item.done, updatedAt: new Date().toISOString() } : item);
  await writeItems(next);
  return next.find((item) => item.id === itemId) || null;
}

export async function removeReadingItem(itemId) {
  const items = await listReadingItems();
  const next = items.filter((item) => item.id !== itemId);
  await writeItems(next);
  return { removed: next.length !== items.length };
}

async function writeItems(items) { await chrome.storage.local.set({ [READING_LIST_KEY]: items }); }
function normalizeItem(item) { const url = normalizeUrl(item?.url); return { id: String(item?.id || crypto.randomUUID()), url, title: String(item?.title || safeTitle(url)).trim().slice(0, 180) || 'Page sans titre', createdAt: validDate(item?.createdAt) ? item.createdAt : new Date().toISOString(), updatedAt: item?.updatedAt, done: Boolean(item?.done) }; }
function normalizeUrl(value) { try { const url = new URL(String(value || '')); return isWebUrl(url.toString()) ? url.toString() : ''; } catch { return ''; } }
function isWebUrl(value) { try { const protocol = new URL(value).protocol; return protocol === 'https:' || protocol === 'http:'; } catch { return false; } }
function safeTitle(url) { try { return new URL(url).hostname; } catch { return ''; } }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
