import { getPomodoroMinutes, getQuickLinks, getSettings } from '../shared/constants.js';
import { buildGoogleUrl } from '../shared/search-service.js';

const $ = (selector) => document.querySelector(selector);
let category = 'web';
let pomodoroTimer;

init();

async function init() {
  renderDate(); bindActions();
  await Promise.all([renderAccount(), renderToday(), renderShortcuts(), renderNotes(), renderReadingList(), renderTasks(), refreshPomodoro()]);
}

function bindActions() {
  $('#newtab-search-button').addEventListener('click', runSearch);
  $('#newtab-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch(); });
  document.querySelectorAll('.search-modes button').forEach((button) => button.addEventListener('click', () => { category = button.dataset.category; document.querySelectorAll('.search-modes button').forEach((item) => item.classList.toggle('active', item === button)); }));
  $('#open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('#manage-shortcuts').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('#open-notes').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') }));
  $('#open-reading-list').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') }));
  $('#open-tasks').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html#tasks') }));
  $('#open-inbox').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html#inbox') }));
  $('#newtab-pomodoro-toggle').addEventListener('click', togglePomodoro);
  $('#newtab-pomodoro-reset').addEventListener('click', resetPomodoro);
}

async function renderAccount() {
  try { const response = await chrome.runtime.sendMessage({ type: 'auth/get-account' }); const name = response?.data?.user?.name; $('#greeting').textContent = name ? `Bonjour, ${name.split(' ')[0]}.` : 'Bonjour.'; $('#account-summary').textContent = name ? `Plan ${String(response.data.plan || 'free').toUpperCase()} · Vos outils sont synchronisés.` : 'Votre espace de travail local est prêt.'; } catch { /* mode local */ }
}

async function renderToday() { try { const [tasksResponse, inboxResponse, focusResponse] = await Promise.all([chrome.runtime.sendMessage({ type: 'tasks/list', period: 'today', includeDone: false }), chrome.runtime.sendMessage({ type: 'inbox/list' }), chrome.runtime.sendMessage({ type: 'focus/stats', days: 7 })]); const tasks = tasksResponse?.ok ? tasksResponse.data : []; const inbox = inboxResponse?.ok ? inboxResponse.data : []; const focus = focusResponse?.ok ? focusResponse.data : { minutes: 0 }; $('#newtab-today').innerHTML = `<div><strong>${tasks.length}</strong><span>échéance(s) aujourd’hui</span></div><div><strong>${inbox.length}</strong><span>capture(s) à traiter</span></div><div><strong>${focus.minutes || 0}</strong><span>minutes de concentration</span></div>${tasks[0] ? `<p>Prochaine action : ${escapeHtml(tasks[0].title)}</p>` : '<p>Aucune échéance urgente.</p>'}`; } catch { $('#newtab-today').textContent = 'Tableau de bord indisponible.'; } }

async function renderShortcuts() {
  const settings = await getSettings(); const links = getQuickLinks(settings);
  $('#newtab-shortcuts').innerHTML = links.slice(0, 6).map((link) => `<a class="newtab-shortcut" href="${escapeAttribute(link.url)}"><i>↗</i>${escapeHtml(link.label)}</a>`).join('');
}

async function renderNotes() {
  try { const response = await chrome.runtime.sendMessage({ type: 'notes/list' }); const notes = response?.ok ? response.data.slice(0, 3) : []; $('#newtab-notes').innerHTML = notes.length ? notes.map((note) => `<article class="newtab-note">${escapeHtml(note.content)}<small>${new Date(note.updatedAt).toLocaleDateString('fr-FR')}</small></article>`).join('') : '<article class="newtab-note">Aucune note récente. Ouvrez le popup pour en créer une.</article>'; } catch { $('#newtab-notes').innerHTML = '<article class="newtab-note">Notes indisponibles hors de l’extension.</article>'; }
}

async function renderReadingList() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'reading/list' });
    const items = response?.ok ? response.data.filter((item) => !item.done).slice(0, 3) : [];
    $('#newtab-reading-list').innerHTML = items.length ? items.map((item) => `<a class="newtab-reading-item" href="${escapeAttribute(item.url)}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(new URL(item.url).hostname)}</small></a>`).join('') : '<p>Aucune page à lire. Ajoutez l’onglet actif depuis AITools.</p>';
  } catch { $('#newtab-reading-list').innerHTML = '<p>Liste de lecture indisponible.</p>'; }
}

async function renderTasks() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'tasks/list', includeDone: false });
    const tasks = response?.ok ? response.data.slice(0, 4) : [];
    $('#newtab-tasks').innerHTML = tasks.length ? tasks.map((task) => `<article class="newtab-task ${task.active ? 'active' : ''}"><span class="task-dot ${escapeAttribute(task.priority)}"></span><div><strong>${escapeHtml(task.title)}</strong><small>${task.active ? 'Tâche active' : task.priority === 'high' ? 'Haute priorité' : task.priority === 'low' ? 'Faible priorité' : 'Priorité normale'}</small></div></article>`).join('') : '<p>Aucune tâche en attente. Ouvrez AITools pour planifier votre prochaine action.</p>';
  } catch { $('#newtab-tasks').innerHTML = '<p>Tâches indisponibles.</p>'; }
}

async function refreshPomodoro() {
  const response = await chrome.runtime.sendMessage({ type: 'pomodoro/get' }); if (!response?.ok) return;
  const state = response.data; const remaining = state.status === 'running' && state.endAt ? Math.max(0, state.endAt - Date.now()) : state.remainingMs;
  $('#newtab-pomodoro').textContent = formatDuration(remaining); $('#newtab-pomodoro-label').textContent = state.status === 'running' ? 'Session en cours.' : state.status === 'paused' ? 'Session en pause.' : state.status === 'done' ? 'Session terminée.' : 'Prêt quand vous l’êtes.'; $('#newtab-pomodoro-toggle').textContent = state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Reprendre' : state.status === 'done' ? 'Recommencer' : 'Démarrer';
  clearInterval(pomodoroTimer); if (state.status === 'running') pomodoroTimer = setInterval(refreshPomodoro, 1000);
}

async function togglePomodoro() { const settings = await getSettings(); const response = await chrome.runtime.sendMessage({ type: 'pomodoro/toggle', durationMinutes: getPomodoroMinutes(settings), cycle: 'focus' }); if (!response?.ok) { $('#newtab-pomodoro-label').textContent = response?.error || 'Pomodoro indisponible.'; return; } await refreshPomodoro(); }
async function resetPomodoro() { const settings = await getSettings(); const response = await chrome.runtime.sendMessage({ type: 'pomodoro/reset', durationMinutes: getPomodoroMinutes(settings), cycle: 'focus' }); if (!response?.ok) { $('#newtab-pomodoro-label').textContent = response?.error || 'Pomodoro indisponible.'; return; } await refreshPomodoro(); }
function runSearch() { const query = $('#newtab-search').value.trim(); if (query) location.href = buildGoogleUrl(query, category); }
function renderDate() { $('#current-date').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase(); }
function formatDuration(milliseconds = 0) { const minutes = Math.floor(Math.max(0, milliseconds) / 60_000); const seconds = Math.floor((Math.max(0, milliseconds) % 60_000) / 1000); return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
