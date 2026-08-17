import { normalizeTags } from './tags-service.js';

const TASKS_KEY = 'aitools.tasks';
const ACTIVE_TASK_KEY = 'aitools.tasks.active';
const MAX_TASKS = 250;
const PRIORITIES = ['low', 'normal', 'high'];
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

export async function listTasks({ includeDone = true, period = 'all', tags = [] } = {}) {
  const result = await chrome.storage.local.get([TASKS_KEY, ACTIVE_TASK_KEY]);
  const activeId = result[ACTIVE_TASK_KEY] || null;
  const source = Array.isArray(result[TASKS_KEY]) ? result[TASKS_KEY].map(normalizeTask).filter((task) => task.title) : [];
  const visible = source.filter((task) => (includeDone || !task.done) && matchesPeriod(task, period) && matchesTags(task, tags));
  return sortTasks(visible).map((task) => ({ ...task, active: task.id === activeId }));
}

export async function createTask(title, priority = 'normal', details = {}) {
  const normalizedTitle = String(title || '').trim();
  if (!normalizedTitle) throw new Error('Le titre de la tâche est obligatoire.');
  if (normalizedTitle.length > 240) throw new Error('Une tâche est limitée à 240 caractères.');
  const now = new Date().toISOString();
  const task = { id: crypto.randomUUID(), title: normalizedTitle, priority: normalizePriority(priority), done: false, tags: normalizeTags(details.tags), dueAt: normalizeDueAt(details.dueAt), reminderAt: normalizeReminder(details.reminderAt), recurrence: normalizeRecurrence(details.recurrence), recurrenceSeriesId: null, sourceUrl: normalizeHttpUrl(details.sourceUrl), createdAt: now, updatedAt: now, completedAt: null };
  const tasks = await readTasks();
  await writeTasks([task, ...tasks].slice(0, MAX_TASKS));
  return task;
}

export async function updateTask(taskId, patch = {}) {
  const tasks = await readTasks(); let updated = null;
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    const title = Object.hasOwn(patch, 'title') ? String(patch.title || '').trim().slice(0, 240) : task.title;
    if (!title) throw new Error('Le titre de la tâche est obligatoire.');
    updated = { ...task, title, priority: Object.hasOwn(patch, 'priority') ? normalizePriority(patch.priority) : task.priority, tags: Object.hasOwn(patch, 'tags') ? normalizeTags(patch.tags) : task.tags, dueAt: Object.hasOwn(patch, 'dueAt') ? normalizeDueAt(patch.dueAt) : task.dueAt, reminderAt: Object.hasOwn(patch, 'reminderAt') ? normalizeReminder(patch.reminderAt) : task.reminderAt, recurrence: Object.hasOwn(patch, 'recurrence') ? normalizeRecurrence(patch.recurrence) : task.recurrence, sourceUrl: Object.hasOwn(patch, 'sourceUrl') ? normalizeHttpUrl(patch.sourceUrl) : task.sourceUrl, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error('Tâche introuvable.');
  await writeTasks(next); return updated;
}

export async function toggleTask(taskId) {
  const tasks = await readTasks(); let toggled = null; let nextOccurrence = null;
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    const done = !task.done; const completedAt = done ? new Date().toISOString() : null;
    toggled = { ...task, done, completedAt, updatedAt: completedAt || new Date().toISOString() };
    if (done && toggled.recurrence !== 'none') nextOccurrence = createNextOccurrence(toggled);
    return toggled;
  });
  if (!toggled) throw new Error('Tâche introuvable.');
  await writeTasks(nextOccurrence ? [nextOccurrence, ...next].slice(0, MAX_TASKS) : next); if (toggled.done) await clearActiveIf(taskId);
  return nextOccurrence ? { ...toggled, nextOccurrence } : toggled;
}

export async function removeTask(taskId) { const tasks = await readTasks(); const next = tasks.filter((task) => task.id !== taskId); await writeTasks(next); await clearActiveIf(taskId); return { removed: next.length !== tasks.length }; }
export async function setActiveTask(taskId) { if (!taskId) { await chrome.storage.local.remove(ACTIVE_TASK_KEY); return null; } const task = (await readTasks()).find((item) => item.id === taskId); if (!task || task.done) throw new Error('Choisissez une tâche non terminée.'); await chrome.storage.local.set({ [ACTIVE_TASK_KEY]: taskId }); return { ...task, active: true }; }
export async function clearCompletedTasks() { const tasks = await readTasks(); const next = tasks.filter((task) => !task.done); await writeTasks(next); const active = (await chrome.storage.local.get(ACTIVE_TASK_KEY))[ACTIVE_TASK_KEY]; if (active && !next.some((task) => task.id === active)) await chrome.storage.local.remove(ACTIVE_TASK_KEY); return { removed: tasks.length - next.length }; }

async function readTasks() { const result = await chrome.storage.local.get(TASKS_KEY); return Array.isArray(result[TASKS_KEY]) ? result[TASKS_KEY].map(normalizeTask).filter((task) => task.title) : []; }
async function writeTasks(tasks) { await chrome.storage.local.set({ [TASKS_KEY]: tasks }); }
async function clearActiveIf(taskId) { const active = (await chrome.storage.local.get(ACTIVE_TASK_KEY))[ACTIVE_TASK_KEY]; if (active === taskId) await chrome.storage.local.remove(ACTIVE_TASK_KEY); }
function normalizeTask(task) { const title = String(task?.title || '').trim().slice(0, 240); const createdAt = validDate(task?.createdAt) ? task.createdAt : new Date().toISOString(); return { id: validId(task?.id) ? task.id : crypto.randomUUID(), title, priority: normalizePriority(task?.priority), done: Boolean(task?.done), tags: normalizeTags(task?.tags), dueAt: normalizeDueAt(task?.dueAt), reminderAt: normalizeReminder(task?.reminderAt), recurrence: normalizeRecurrence(task?.recurrence), recurrenceSeriesId: validId(task?.recurrenceSeriesId) ? task.recurrenceSeriesId : null, sourceUrl: normalizeHttpUrl(task?.sourceUrl), createdAt, updatedAt: validDate(task?.updatedAt) ? task.updatedAt : createdAt, completedAt: validDate(task?.completedAt) ? task.completedAt : null }; }
function normalizePriority(value) { return PRIORITIES.includes(value) ? value : 'normal'; }
function normalizeRecurrence(value) { return RECURRENCES.includes(value) ? value : 'none'; }
function createNextOccurrence(task) { const now = new Date(); const base = task.dueAt ? new Date(task.dueAt) : new Date(task.completedAt || now); const due = advanceRecurringDate(base, task.recurrence, now); const reminderOffset = task.dueAt && task.reminderAt ? new Date(task.reminderAt).getTime() - new Date(task.dueAt).getTime() : null; const reminderAt = reminderOffset === null ? null : new Date(due.getTime() + reminderOffset).toISOString(); const timestamp = now.toISOString(); return { ...task, id: crypto.randomUUID(), done: false, dueAt: due.toISOString(), reminderAt: normalizeReminder(reminderAt), recurrenceSeriesId: task.recurrenceSeriesId || task.id, createdAt: timestamp, updatedAt: timestamp, completedAt: null }; }
function advanceRecurringDate(base, recurrence, now) { const date = new Date(base); const advance = () => { if (recurrence === 'daily') date.setDate(date.getDate() + 1); if (recurrence === 'weekly') date.setDate(date.getDate() + 7); if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1); }; do { advance(); } while (date <= now); return date; }
function normalizeDueAt(value) { return validDate(value) ? new Date(value).toISOString() : null; }
function normalizeReminder(value) { const date = normalizeDueAt(value); return date && new Date(date) > new Date(Date.now() - 86_400_000) ? date : null; }
function normalizeHttpUrl(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null; } catch { return null; } }
function validId(value) { return typeof value === 'string' && value.length >= 12 && value.length <= 80; }
function validDate(value) { return value && Number.isFinite(new Date(value).getTime()); }
function matchesTags(task, tags) { const filter = new Set(normalizeTags(tags)); return !filter.size || [...filter].every((tag) => task.tags.includes(tag)); }
function matchesPeriod(task, period) { if (period === 'all' || !task.dueAt) return true; const due = new Date(task.dueAt); const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (period === 'overdue') return due < start; if (period === 'today') return due >= start && due < new Date(start.getTime() + 86_400_000); if (period === 'week') return due >= start && due < new Date(start.getTime() + 7 * 86_400_000); return true; }
function sortTasks(tasks) { const weights = { high: 0, normal: 1, low: 2 }; return [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.dueAt ? 0 : 1) - (b.dueAt ? 0 : 1) || (a.dueAt && b.dueAt ? new Date(a.dueAt) - new Date(b.dueAt) : 0) || weights[a.priority] - weights[b.priority] || new Date(b.updatedAt) - new Date(a.updatedAt)); }
