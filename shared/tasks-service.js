const TASKS_KEY = 'aitools.tasks';
const ACTIVE_TASK_KEY = 'aitools.tasks.active';
const MAX_TASKS = 250;
const PRIORITIES = ['low', 'normal', 'high'];

export async function listTasks({ includeDone = true } = {}) {
  const result = await chrome.storage.local.get([TASKS_KEY, ACTIVE_TASK_KEY]);
  const activeId = result[ACTIVE_TASK_KEY] || null;
  const tasks = Array.isArray(result[TASKS_KEY]) ? result[TASKS_KEY].map(normalizeTask).filter((task) => task.title) : [];
  const visible = includeDone ? tasks : tasks.filter((task) => !task.done);
  return sortTasks(visible).map((task) => ({ ...task, active: task.id === activeId }));
}

export async function createTask(title, priority = 'normal') {
  const normalizedTitle = String(title || '').trim();
  if (!normalizedTitle) throw new Error('Le titre de la tâche est obligatoire.');
  if (normalizedTitle.length > 240) throw new Error('Une tâche est limitée à 240 caractères.');
  const now = new Date().toISOString();
  const task = { id: crypto.randomUUID(), title: normalizedTitle, priority: normalizePriority(priority), done: false, createdAt: now, updatedAt: now };
  const tasks = await readTasks();
  await writeTasks([task, ...tasks].slice(0, MAX_TASKS));
  return task;
}

export async function toggleTask(taskId) {
  const tasks = await readTasks();
  let toggled = null;
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    toggled = { ...task, done: !task.done, updatedAt: new Date().toISOString() };
    return toggled;
  });
  if (!toggled) throw new Error('Tâche introuvable.');
  await writeTasks(next);
  if (toggled.done) await clearActiveIf(taskId);
  return toggled;
}

export async function removeTask(taskId) {
  const tasks = await readTasks();
  const next = tasks.filter((task) => task.id !== taskId);
  await writeTasks(next);
  await clearActiveIf(taskId);
  return { removed: next.length !== tasks.length };
}

export async function setActiveTask(taskId) {
  if (!taskId) { await chrome.storage.local.remove(ACTIVE_TASK_KEY); return null; }
  const task = (await readTasks()).find((item) => item.id === taskId);
  if (!task || task.done) throw new Error('Choisissez une tâche non terminée.');
  await chrome.storage.local.set({ [ACTIVE_TASK_KEY]: taskId });
  return { ...task, active: true };
}

export async function clearCompletedTasks() {
  const tasks = await readTasks();
  const next = tasks.filter((task) => !task.done);
  await writeTasks(next);
  const active = (await chrome.storage.local.get(ACTIVE_TASK_KEY))[ACTIVE_TASK_KEY];
  if (active && !next.some((task) => task.id === active)) await chrome.storage.local.remove(ACTIVE_TASK_KEY);
  return { removed: tasks.length - next.length };
}

async function readTasks() { const result = await chrome.storage.local.get(TASKS_KEY); return Array.isArray(result[TASKS_KEY]) ? result[TASKS_KEY].map(normalizeTask).filter((task) => task.title) : []; }
async function writeTasks(tasks) { await chrome.storage.local.set({ [TASKS_KEY]: tasks }); }
async function clearActiveIf(taskId) { const active = (await chrome.storage.local.get(ACTIVE_TASK_KEY))[ACTIVE_TASK_KEY]; if (active === taskId) await chrome.storage.local.remove(ACTIVE_TASK_KEY); }
function normalizeTask(task) { const title = String(task?.title || '').trim().slice(0, 240); const createdAt = validDate(task?.createdAt) ? task.createdAt : new Date().toISOString(); return { id: validId(task?.id) ? task.id : crypto.randomUUID(), title, priority: normalizePriority(task?.priority), done: Boolean(task?.done), createdAt, updatedAt: validDate(task?.updatedAt) ? task.updatedAt : createdAt }; }
function normalizePriority(value) { return PRIORITIES.includes(value) ? value : 'normal'; }
function validId(value) { return typeof value === 'string' && value.length >= 12 && value.length <= 80; }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
function sortTasks(tasks) { const weights = { high: 0, normal: 1, low: 2 }; return [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || weights[a.priority] - weights[b.priority] || new Date(b.updatedAt) - new Date(a.updatedAt)); }
