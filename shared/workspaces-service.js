import { normalizeTags } from './tags-service.js';

const WORKSPACES_KEY = 'aitools.workspaces';
const MAX_WORKSPACES = 80;
const MAX_TABS_PER_WORKSPACE = 80;

export async function listWorkspaces({ tags = [] } = {}) {
  const result = await chrome.storage.local.get(WORKSPACES_KEY);
  const filter = new Set(normalizeTags(tags));
  const spaces = Array.isArray(result[WORKSPACES_KEY]) ? result[WORKSPACES_KEY].map(normalizeWorkspace).filter((space) => space.name) : [];
  return spaces.filter((space) => [...filter].every((tag) => space.tags.includes(tag))).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function captureCurrentWorkspace(name, details = {}) {
  const normalizedName = String(name || '').trim().slice(0, 120);
  if (!normalizedName) throw new Error('Donnez un nom à cet espace de travail.');
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const savedTabs = tabs.filter((tab) => isWebUrl(tab.url)).slice(0, MAX_TABS_PER_WORKSPACE).map((tab) => ({ url: normalizeUrl(tab.url), title: String(tab.title || safeTitle(tab.url)).trim().slice(0, 180), pinned: Boolean(tab.pinned), group: tab.groupId >= 0 ? String(tab.groupId) : null }));
  if (!savedTabs.length) throw new Error('Aucun onglet web à enregistrer dans cette fenêtre.');
  const now = new Date().toISOString(); const workspace = { id: crypto.randomUUID(), name: normalizedName, tags: normalizeTags(details.tags), tabs: savedTabs, createdAt: now, updatedAt: now };
  const spaces = await listWorkspaces(); await writeWorkspaces([workspace, ...spaces].slice(0, MAX_WORKSPACES)); return workspace;
}

export async function restoreWorkspace(workspaceId) {
  const workspace = (await listWorkspaces()).find((item) => item.id === workspaceId);
  if (!workspace) throw new Error('Espace de travail introuvable.');
  let opened = 0;
  for (const tab of workspace.tabs) { if (!isWebUrl(tab.url)) continue; await chrome.tabs.create({ url: tab.url, active: false, pinned: Boolean(tab.pinned) }); opened += 1; }
  return { opened, name: workspace.name };
}

export async function updateWorkspace(workspaceId, patch = {}) {
  const spaces = await listWorkspaces(); let updated = null;
  const next = spaces.map((space) => { if (space.id !== workspaceId) return space; updated = { ...space, name: Object.hasOwn(patch, 'name') ? String(patch.name || '').trim().slice(0, 120) || space.name : space.name, tags: Object.hasOwn(patch, 'tags') ? normalizeTags(patch.tags) : space.tags, updatedAt: new Date().toISOString() }; return updated; });
  if (!updated) throw new Error('Espace de travail introuvable.'); await writeWorkspaces(next); return updated;
}

export async function removeWorkspace(workspaceId) { const spaces = await listWorkspaces(); const next = spaces.filter((space) => space.id !== workspaceId); await writeWorkspaces(next); return { removed: next.length !== spaces.length }; }

async function writeWorkspaces(workspaces) { await chrome.storage.local.set({ [WORKSPACES_KEY]: workspaces }); }
function normalizeWorkspace(space) { const tabs = Array.isArray(space?.tabs) ? space.tabs.filter((tab) => isWebUrl(tab?.url)).slice(0, MAX_TABS_PER_WORKSPACE).map((tab) => ({ url: normalizeUrl(tab.url), title: String(tab?.title || safeTitle(tab.url)).trim().slice(0, 180), pinned: Boolean(tab?.pinned), group: tab?.group ? String(tab.group).slice(0, 80) : null })) : []; const createdAt = validDate(space?.createdAt) ? space.createdAt : new Date().toISOString(); return { id: typeof space?.id === 'string' && space.id.length >= 12 ? space.id : crypto.randomUUID(), name: String(space?.name || '').trim().slice(0, 120), tags: normalizeTags(space?.tags), tabs, createdAt, updatedAt: validDate(space?.updatedAt) ? space.updatedAt : createdAt }; }
function normalizeUrl(value) { try { const url = new URL(String(value || '')); return isWebUrl(url.toString()) ? url.toString() : ''; } catch { return ''; } }
function isWebUrl(value) { try { return ['http:', 'https:'].includes(new URL(String(value || '')).protocol); } catch { return false; } }
function safeTitle(url) { try { return new URL(url).hostname; } catch { return ''; } }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
