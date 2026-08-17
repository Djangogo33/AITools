import { listNotes } from './notes-service.js';
import { listTasks } from './tasks-service.js';
import { listReadingItems } from './reading-list-service.js';
import { normalizeTags } from './tags-service.js';

const WORKSPACES_KEY = 'aitools.workspaces';

export async function searchWorkspace(query, { tags = [], limit = 50 } = {}) {
  const terms = tokenize(query); const normalizedTags = normalizeTags(tags);
  const [notes, tasks, reading, stored] = await Promise.all([listNotes(), listTasks(), listReadingItems(), chrome.storage.local.get(WORKSPACES_KEY)]);
  const workspaces = Array.isArray(stored[WORKSPACES_KEY]) ? stored[WORKSPACES_KEY] : [];
  const results = [
    ...notes.map((item) => ({ type: 'note', id: item.id, title: truncate(item.content, 96), text: item.content, tags: normalizeTags(item.tags), updatedAt: item.updatedAt, url: item.sourceUrl || null })),
    ...tasks.map((item) => ({ type: 'task', id: item.id, title: item.title, text: `${item.title} ${(item.tags || []).join(' ')}`, tags: normalizeTags(item.tags), updatedAt: item.updatedAt, dueAt: item.dueAt, done: item.done, url: item.sourceUrl || null })),
    ...reading.map((item) => ({ type: 'reading', id: item.id, title: item.title, text: `${item.title} ${item.url}`, tags: normalizeTags(item.tags), updatedAt: item.updatedAt || item.createdAt, url: item.url, done: item.done })),
    ...workspaces.map((item) => ({ type: 'workspace', id: item.id, title: item.name, text: `${item.name} ${(item.tags || []).join(' ')} ${(item.tabs || []).map((tab) => `${tab.title} ${tab.url}`).join(' ')}`, tags: normalizeTags(item.tags), updatedAt: item.updatedAt, count: Array.isArray(item.tabs) ? item.tabs.length : 0 }))
  ];
  return results.filter((item) => matches(item, terms, normalizedTags)).sort(scoreSorter(terms)).slice(0, Math.max(1, Math.min(100, Number(limit) || 50)));
}

export async function listWorkspaceTags() {
  const [notes, tasks, reading, stored] = await Promise.all([listNotes(), listTasks(), listReadingItems(), chrome.storage.local.get(WORKSPACES_KEY)]);
  const tags = [...notes, ...tasks, ...reading, ...(Array.isArray(stored[WORKSPACES_KEY]) ? stored[WORKSPACES_KEY] : [])].flatMap((item) => normalizeTags(item.tags));
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b, 'fr'));
}

function tokenize(query) { return String(query || '').toLocaleLowerCase('fr-FR').trim().split(/\s+/).filter(Boolean).slice(0, 12); }
function matches(item, terms, tags) { const haystack = `${item.title || ''} ${item.text || ''} ${(item.tags || []).join(' ')}`.toLocaleLowerCase('fr-FR'); return terms.every((term) => haystack.includes(term)) && tags.every((tag) => item.tags.includes(tag)); }
function scoreSorter(terms) { return (a, b) => score(b, terms) - score(a, terms) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); }
function score(item, terms) { const title = String(item.title || '').toLocaleLowerCase('fr-FR'); return terms.reduce((total, term) => total + (title.includes(term) ? 4 : String(item.text || '').toLocaleLowerCase('fr-FR').includes(term) ? 1 : 0), item.done ? -1 : 0); }
function truncate(value, length) { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > length ? `${text.slice(0, length - 1)}…` : text; }
