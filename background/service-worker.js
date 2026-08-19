import { MESSAGE_TYPES, NEW_TAB_SEARCH_ENGINES, STORAGE_KEYS, getPomodoroMinutes, getSettings, isFeatureEnabled } from '../shared/constants.js';
import { getAccount, isFeatureAllowed, signInWithGoogle, signOut } from '../shared/auth-client.js';
import { createNote, deleteNote, importGuestNotes, listNotes, syncNotes } from '../shared/notes-service.js';
import { createCheckout, createPortal } from '../shared/billing-client.js';
import { listReadingItems, removeReadingItem, saveCurrentPage, toggleReadingItem, updateReadingItem } from '../shared/reading-list-service.js';
import { listWorkspaceTags, searchWorkspace } from '../shared/unified-search-service.js';
import { captureCurrentWorkspace, listWorkspaces, removeWorkspace, restoreWorkspace, updateWorkspace } from '../shared/workspaces-service.js';
import { domainIsMuted, getDndSettings, getFocusStats, recordFocusSession, saveDndSettings } from '../shared/focus-service.js';
import { clearCompletedTasks, createTask, listTasks, removeTask, setActiveTask, toggleTask, updateTask } from '../shared/tasks-service.js';
import { applyTabRules, createTabRule, listTabRules, removeTabRule, toggleTabRule } from '../shared/tab-rules-service.js';
import { getPersonalSyncStatus, markPersonalDeleted, syncPersonalData } from '../shared/personal-sync-service.js';
import { createUserExport } from '../shared/export-service.js';
import { addCapture, dismissCapture, listInbox, processCapture } from '../shared/inbox-service.js';
import { getWeeklyReview } from '../shared/analytics-service.js';
import { createDiagnosticsExport, listDiagnostics } from '../shared/diagnostics-service.js';
import { migrateLocalData } from '../shared/migration-service.js';

const POMODORO_ALARM = 'aitools-pomodoro-complete';
const TASK_REMINDER_PREFIX = 'aitools-task-reminder:';
let pomodoroCompletionInFlight = null;
let pomodoroCompletionEndAt = null;
const DEFAULT_POMODORO = { status: 'idle', durationMs: 25 * 60_000, remainingMs: 25 * 60_000, endAt: null, cycle: 'focus' };
const MESSAGE_FEATURES = {
  'auth/sign-in-google': 'service.auth', 'auth/sign-out': 'service.auth',
  'billing/create-checkout': 'service.billing', 'billing/create-portal': 'service.billing',
  'notes/list': 'productivity.notes', 'notes/create': 'productivity.notes', 'notes/delete': 'productivity.notes', 'notes/sync': 'service.sync', 'notes/import-guest': 'service.sync',
  'inbox/list': 'productivity.inbox', 'inbox/add': 'productivity.inbox', 'inbox/process': 'productivity.inbox', 'inbox/dismiss': 'productivity.inbox',
  'reading/list': 'productivity.reading', 'reading/save-current': 'productivity.reading', 'reading/toggle': 'productivity.reading', 'reading/remove': 'productivity.reading', 'reading/update': 'productivity.reading',
  'personal/sync': 'service.sync', 'personal/sync-status': 'service.sync', 'search/unified': 'search.local',
  'export/create': 'data.backup', 'diagnostics/list': 'diagnostics', 'diagnostics/export': 'diagnostics', 'focus/stats': 'productivity.focus', 'analytics/weekly-review': 'productivity.focus', 'focus/get-dnd': 'productivity.focus', 'focus/save-dnd': 'productivity.focus',
  'tab-rules/list': 'browser.rules', 'tab-rules/create': 'browser.rules', 'tab-rules/toggle': 'browser.rules', 'tab-rules/remove': 'browser.rules', 'tab-rules/apply': 'browser.rules', 'tabs/close-duplicates': 'browser.duplicates', 'tabs/group-by-domain': 'browser.grouping', 'tabs/get-stats': 'browser.finder',
  'workspaces/list': 'productivity.workspaces', 'workspaces/capture': 'productivity.workspaces', 'workspaces/restore': 'productivity.workspaces', 'workspaces/update': 'productivity.workspaces', 'workspaces/remove': 'productivity.workspaces',
  'tasks/list': 'productivity.tasks', 'tasks/create': 'productivity.tasks', 'tasks/toggle': 'productivity.tasks', 'tasks/update': 'productivity.tasks', 'tasks/remove': 'productivity.tasks', 'tasks/set-active': 'productivity.tasks', 'tasks/clear-completed': 'productivity.tasks',
  'pomodoro/get': 'productivity.pomodoro', 'pomodoro/toggle': 'productivity.pomodoro', 'pomodoro/reset': 'productivity.pomodoro', 'newtab/open-search': 'newtab.search'
};

chrome.runtime.onInstalled.addListener(async () => {
  await migrateLocalData();
  const current = await chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.notes, STORAGE_KEYS.pomodoro]);
  if (!current[STORAGE_KEYS.settings]) await chrome.storage.local.set({ [STORAGE_KEYS.settings]: { theme: 'dark', notifications: true, compactMode: false, quickLinks: [] } });
  if (!current[STORAGE_KEYS.notes]) await chrome.storage.local.set({ [STORAGE_KEYS.notes]: [] });
  if (!current[STORAGE_KEYS.pomodoro]) await chrome.storage.local.set({ [STORAGE_KEYS.pomodoro]: DEFAULT_POMODORO });
  await rescheduleTaskReminders();
});

chrome.runtime.onStartup.addListener(() => { migrateLocalData().then(rescheduleTaskReminders).catch(() => rescheduleTaskReminders()); });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith(TASK_REMINDER_PREFIX)) {
    const taskId = alarm.name.slice(TASK_REMINDER_PREFIX.length);
    const task = (await listTasks()).find((item) => item.id === taskId);
    if (task && !task.done) await notifyCommand('Rappel AITools', `${task.title}${task.dueAt ? ` · échéance ${new Date(task.dueAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`);
    return;
  }
  if (alarm.name !== POMODORO_ALARM) return;
  const state = await getPomodoro();
  if (state.status !== 'running') return;
  await completePomodoro(state, { notify: true });
});

chrome.commands.onCommand.addListener(async (command) => {
  try {
    if (command === 'toggle-pomodoro') {
      const settings = await getSettings();
      if (!isFeatureEnabled(settings, 'productivity.pomodoro')) return notifyCommand('Pomodoro AITools', 'Cette fonctionnalité est désactivée dans vos préférences.');
      const state = await togglePomodoro(getPomodoroMinutes(settings), 'focus');
      await notifyCommand('Pomodoro AITools', state.status === 'running' ? 'Session démarrée.' : 'Session suspendue.');
    }
    if (command === 'save-to-reading-list') {
      if (!isFeatureEnabled(await getSettings(), 'productivity.reading')) return notifyCommand('Liste de lecture AITools', 'Cette fonctionnalité est désactivée dans vos préférences.');
      const result = await saveCurrentPage();
      await notifyCommand('Liste de lecture AITools', result.created ? 'Page ajoutée à votre liste.' : 'Cette page est déjà enregistrée.');
    }
    if (command === 'open-command-launcher') await openCommandLauncher();
  } catch (error) { await notifyCommand('AITools', normalizeError(error)); }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEYS.settings]) return;
  const nextSettings = changes[STORAGE_KEYS.settings].newValue || {};
  if (!isFeatureEnabled(nextSettings, 'productivity.pomodoro')) { await chrome.alarms.clear(POMODORO_ALARM); await savePomodoro({ ...DEFAULT_POMODORO, durationMs: getPomodoroMinutes(nextSettings) * 60_000, remainingMs: getPomodoroMinutes(nextSettings) * 60_000 }); }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => { await applyDndToTab(tabId); });
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => { if (changeInfo.status === 'complete' && tab.active) await applyDndToTab(tabId, tab.url); });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    'auth/get-account': () => getAccount(),
    'auth/sign-in-google': () => signInWithGoogle(),
    'auth/sign-out': () => signOut(),
    'auth/is-feature-allowed': () => isFeatureAllowed(message.feature),
    'billing/create-checkout': () => createCheckout(message.plan),
    'billing/create-portal': () => createPortal(),
    'notes/list': () => listNotes(),
    'notes/create': () => createNote(message.content, message.details || {}),
    'notes/delete': () => deleteNote(message.noteId),
    'notes/sync': () => syncNotes(),
    'notes/import-guest': () => importGuestNotes(),
    'inbox/list': () => listInbox({ includeProcessed: message.includeProcessed === true }),
    'inbox/add': () => addCapture(message.capture || {}),
    'inbox/process': () => processCapture(message.captureId, message.target),
    'inbox/dismiss': () => dismissCapture(message.captureId),
    'reading/list': () => listReadingItems(),
    'reading/save-current': () => saveCurrentPage(),
    'reading/toggle': () => toggleReadingItem(message.itemId),
    'reading/remove': async () => { const result = await removeReadingItem(message.itemId); await markPersonalDeleted('reading', message.itemId); return result; },
    'reading/update': () => updateReadingItem(message.itemId, message.patch),
    'search/unified': () => searchWorkspace(message.query, { tags: message.tags || [], limit: message.limit }),
    'tags/list': () => listWorkspaceTags(),
    'personal/sync': () => syncPersonalData(),
    'personal/sync-status': () => getPersonalSyncStatus(),
    'export/create': () => createUserExport(message.format),
    'focus/stats': () => getFocusStats(message.days),
    'analytics/weekly-review': () => getWeeklyReview(),
    'diagnostics/list': () => listDiagnostics(message.limit),
    'diagnostics/export': () => createDiagnosticsExport(),
    'focus/get-dnd': () => getDndSettings(),
    'focus/save-dnd': () => saveDndSettings(message.patch || {}),
    'tab-rules/list': () => listTabRules(),
    'tab-rules/create': () => createTabRule(message.domain, message.color),
    'tab-rules/toggle': () => toggleTabRule(message.ruleId),
    'tab-rules/remove': () => removeTabRule(message.ruleId),
    'tab-rules/apply': () => applyTabRules(),
    'workspaces/list': () => listWorkspaces({ tags: message.tags || [] }),
    'workspaces/capture': () => captureCurrentWorkspace(message.name, { tags: message.tags || [] }),
    'workspaces/restore': () => restoreWorkspace(message.workspaceId),
    'workspaces/update': () => updateWorkspace(message.workspaceId, message.patch),
    'workspaces/remove': async () => { const result = await removeWorkspace(message.workspaceId); await markPersonalDeleted('workspaces', message.workspaceId); return result; },
    'tasks/list': () => listTasks({ includeDone: message.includeDone !== false, period: message.period || 'all', tags: message.tags || [] }),
    'tasks/create': async () => { const task = await createTask(message.title, message.priority, message.details || {}); await scheduleTaskReminder(task); return task; },
    'tasks/toggle': async () => { const task = await toggleTask(message.taskId); await scheduleTaskReminder(task); if (task.nextOccurrence) await scheduleTaskReminder(task.nextOccurrence); return task; },
    'tasks/update': async () => { const task = await updateTask(message.taskId, message.patch); await scheduleTaskReminder(task); return task; },
    'tasks/remove': async () => { const result = await removeTask(message.taskId); await chrome.alarms.clear(`${TASK_REMINDER_PREFIX}${message.taskId}`); await markPersonalDeleted('tasks', message.taskId); return result; },
    'tasks/set-active': () => setActiveTask(message.taskId),
    'tasks/clear-completed': async () => { const result = await clearCompletedTasks(); await rescheduleTaskReminders(); return result; },
    'pomodoro/get': () => getPomodoro(),
    'pomodoro/toggle': () => togglePomodoro(message.durationMinutes, message.cycle),
    'pomodoro/reset': () => resetPomodoro(message.durationMinutes, message.cycle),
    'tabs/close-duplicates': () => closeDuplicateTabs(),
    'tabs/group-by-domain': () => groupTabsByDomain(),
    'tabs/get-stats': () => getTabStats(),
    'newtab/open-native': () => openNativeNewTab(sender.tab?.id),
    'newtab/open-search': () => openNewTabSearch(sender.tab?.id, message.url)
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  Promise.resolve().then(async () => { const featureId = MESSAGE_FEATURES[message?.type]; if (featureId && !isFeatureEnabled(await getSettings(), featureId)) throw new Error('Cette fonctionnalité est désactivée dans vos préférences.'); return handler(); }).then((data) => sendResponse({ ok: true, data })).catch((error) => sendResponse({ ok: false, error: normalizeError(error) }));
  return true;
});

async function navigationTabId(tabId) {
  if (Number.isInteger(tabId)) return tabId;
  const newTabUrl = chrome.runtime.getURL('newtab/index.html');
  const candidates = await chrome.tabs.query({ url: newTabUrl });
  const newest = candidates.filter((tab) => Number.isInteger(tab.id)).sort((left, right) => (Number(right.lastAccessed || 0) - Number(left.lastAccessed || 0)) || (Number(right.id) - Number(left.id)))[0];
  if (Number.isInteger(newest?.id)) return newest.id;
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!Number.isInteger(activeTab?.id)) throw new Error('Onglet de nouvel onglet introuvable.');
  return activeTab.id;
}

async function openNativeNewTab(tabId) {
  await chrome.tabs.update(await navigationTabId(tabId), { url: 'chrome-search://local-ntp/local-ntp.html' });
  return { redirected: true };
}

async function openNewTabSearch(tabId, url) {
  const allowed = Object.values(NEW_TAB_SEARCH_ENGINES).some((engine) => engine.url === url);
  if (!allowed) throw new Error('Moteur de recherche non autorisé.');
  await chrome.tabs.update(await navigationTabId(tabId), { url });
  return { redirected: true };
}

async function openCommandLauncher() {
  const url = chrome.runtime.getURL('popup/index.html#command');
  const existing = (await chrome.tabs.query({ url })).find((tab) => tab.id);
  if (existing?.id) { await chrome.tabs.update(existing.id, { active: true }); if (existing.windowId) await chrome.windows.update(existing.windowId, { focused: true }); return; }
  await chrome.tabs.create({ url });
}

async function getPomodoro() {
  const state = (await chrome.storage.local.get(STORAGE_KEYS.pomodoro))[STORAGE_KEYS.pomodoro] || DEFAULT_POMODORO;
  if (state.status === 'running' && state.endAt && state.endAt <= Date.now()) return completePomodoro(state, { notify: true });
  return state.status === 'running' ? { ...state, remainingMs: Math.max(0, state.endAt - Date.now()) } : state;
}

async function togglePomodoro(durationMinutes = 25, cycle = 'focus') {
  const current = await getPomodoro();
  if (current.status === 'running') {
    const paused = { ...current, status: 'paused', remainingMs: Math.max(0, current.endAt - Date.now()), endAt: null };
    await chrome.alarms.clear(POMODORO_ALARM); await savePomodoro(paused); return paused;
  }
  const isRestart = current.status === 'done' || current.cycle !== cycle || !current.remainingMs;
  const durationMs = Math.max(1, Number(durationMinutes || 25)) * 60_000;
  const remainingMs = isRestart ? durationMs : current.remainingMs;
  const running = { status: 'running', durationMs, remainingMs, endAt: Date.now() + remainingMs, cycle };
  await chrome.alarms.create(POMODORO_ALARM, { when: running.endAt }); await savePomodoro(running); return running;
}

async function resetPomodoro(durationMinutes = 25, cycle = 'focus') {
  const durationMs = Math.max(1, Number(durationMinutes || 25)) * 60_000;
  await chrome.alarms.clear(POMODORO_ALARM);
  const reset = { status: 'idle', durationMs, remainingMs: durationMs, endAt: null, cycle };
  await savePomodoro(reset); return reset;
}

async function savePomodoro(state) { await chrome.storage.local.set({ [STORAGE_KEYS.pomodoro]: state }); }

function completePomodoro(state, { notify = false } = {}) {
  if (!pomodoroCompletionInFlight || pomodoroCompletionEndAt !== state.endAt) {
    pomodoroCompletionEndAt = state.endAt;
    pomodoroCompletionInFlight = completePomodoroOnce(state, { notify }).finally(() => { pomodoroCompletionInFlight = null; pomodoroCompletionEndAt = null; });
  }
  return pomodoroCompletionInFlight;
}

async function completePomodoroOnce(state, { notify }) {
  const done = { ...state, status: 'done', remainingMs: 0, endAt: null };
  await savePomodoro(done);
  if (state.cycle === 'focus') {
    const activeTask = (await listTasks({ includeDone: false })).find((task) => task.active);
    await recordFocusSession({ durationMs: state.durationMs, taskId: activeTask?.id, taskTitle: activeTask?.title });
  }
  if (notify) {
    const settings = (await chrome.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings] || {};
    if (settings.notifications !== false) await createNotification({ title: 'Pomodoro terminé', message: state.cycle === 'focus' ? 'Session terminée. Accordez-vous une pause.' : 'Pause terminée. Prêt pour une nouvelle session ?' });
  }
  return done;
}

async function closeDuplicateTabs() {
  const tabs = await chrome.tabs.query({});
  const seen = new Set(); const duplicateIds = [];
  for (const tab of tabs) {
    if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.pinned) continue;
    const fingerprint = tab.url.split('#')[0];
    if (seen.has(fingerprint)) duplicateIds.push(tab.id); else seen.add(fingerprint);
  }
  if (duplicateIds.length) await chrome.tabs.remove(duplicateIds);
  return { closed: duplicateIds.length };
}

async function groupTabsByDomain() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = new Map();
  for (const tab of tabs) {
    if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.pinned) continue;
    try { const host = new URL(tab.url).hostname.replace(/^www\./, ''); groups.set(host, [...(groups.get(host) || []), tab.id]); } catch { /* URL non groupable */ }
  }
  const colors = ['blue', 'cyan', 'green', 'yellow', 'orange', 'pink', 'purple']; let count = 0;
  for (const [domain, tabIds] of groups) {
    if (tabIds.length < 2) continue;
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, { title: domain, color: colors[count % colors.length], collapsed: false }); count += 1;
  }
  return { groups: count };
}

async function getTabStats() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const unique = new Set(tabs.filter((tab) => tab.url).map((tab) => tab.url.split('#')[0]));
  return { total: tabs.length, duplicates: tabs.length - unique.size, audible: tabs.filter((tab) => tab.audible).length };
}

async function applyDndToTab(tabId, url) {
  try {
    const tab = url ? { url } : await chrome.tabs.get(tabId);
    const settings = await getDndSettings();
    if (!/^https?:/i.test(tab.url || '')) return;
    await chrome.tabs.sendMessage(tabId, { type: 'page/set-focus', enabled: domainIsMuted(tab.url, settings) });
  } catch { /* Le script de contenu n’est pas encore disponible sur cette page. */ }
}

async function scheduleTaskReminder(task) {
  const name = `${TASK_REMINDER_PREFIX}${task.id}`;
  await chrome.alarms.clear(name);
  const when = task?.reminderAt ? new Date(task.reminderAt).getTime() : 0;
  if (!task?.done && Number.isFinite(when) && when > Date.now()) await chrome.alarms.create(name, { when });
}

async function rescheduleTaskReminders() {
  const tasks = await listTasks();
  for (const task of tasks) await scheduleTaskReminder(task);
}

async function notifyCommand(title, message) {
  const settings = (await chrome.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings] || {};
  if (settings.notifications !== false) await createNotification({ title, message });
}

async function createNotification({ title, message }) {
  try { await chrome.notifications.create({ type: 'basic', iconUrl: chrome.runtime.getURL('assets/icon-128.png'), title, message }); } catch { /* Une notification indisponible ne doit pas bloquer l’action locale. */ }
}

function normalizeError(error) {
  const message = String(error?.message || error || 'Une erreur inattendue est survenue.');
  if (/did not approve|access_denied|cancel/i.test(message)) return 'Connexion annulée.';
  return message;
}
