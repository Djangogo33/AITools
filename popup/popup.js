import { DEFAULT_SETTINGS, MESSAGE_TYPES, STORAGE_KEYS, getNotes, getSettings, saveNotes, saveSettings } from '../shared/constants.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let settings = { ...DEFAULT_SETTINGS };
let notes = [];
let pomodoro = { status: 'idle', remaining: 1500, notifications: true };
let pomodoroTimer;

init();

async function init() {
  settings = await getSettings();
  notes = await getNotes();
  applyTheme(settings.theme);
  $('#dark-mode-setting').checked = settings.theme === 'dark';
  $('#notifications-setting').checked = settings.notifications !== false;
  $('#compact-setting').checked = settings.compactMode === true;
  renderQuickLinks();
  renderNotes();
  bindNavigation();
  bindActions();
}

function bindNavigation() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
}

function showView(view) {
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  $$('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
  const titles = { home: ['VOTRE ESPACE DE TRAVAIL', 'Bonjour, Alex'], search: ['RECHERCHE UNIVERSELLE', 'Rechercher mieux'], tools: ['BOÎTE À OUTILS', 'Travaillez plus vite'], notes: ['VOTRE CARNET', 'Notes rapides'], settings: ['PERSONNALISATION', 'Préférences'] };
  $('#view-eyebrow').textContent = titles[view][0];
  $('#view-title').innerHTML = `${titles[view][1]} <span>✦</span>`;
}

function bindActions() {
  $('#theme-toggle').addEventListener('click', async () => {
    const theme = settings.theme === 'dark' ? 'light' : 'dark';
    settings = await saveSettings({ theme }); applyTheme(theme); $('#dark-mode-setting').checked = theme === 'dark';
  });
  $('#close-popup').addEventListener('click', () => window.close());
  $('#dark-mode-setting').addEventListener('change', async (event) => { settings = await saveSettings({ theme: event.target.checked ? 'dark' : 'light' }); applyTheme(settings.theme); });
  $('#notifications-setting').addEventListener('change', async (event) => { settings = await saveSettings({ notifications: event.target.checked }); });
  $('#compact-setting').addEventListener('change', async (event) => { settings = await saveSettings({ compactMode: event.target.checked }); document.body.classList.toggle('compact', event.target.checked); });
  $('#search-submit').addEventListener('click', runSearch);
  $('#search-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch(); });
  $$('[data-query]').forEach((button) => button.addEventListener('click', () => { $('#search-input').value = `${button.dataset.query}${$('#search-input').value}`; $('#search-input').focus(); }));
  $('#home-summarize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.summarizePage));
  $('#home-note').addEventListener('click', () => { showView('notes'); $('#note-input').focus(); });
  $('#tool-summarize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.summarizePage));
  $('#tool-anonymize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.anonymizePage));
  $('#tool-duplicates').addEventListener('click', closeDuplicates);
  $('#save-note').addEventListener('click', saveNote);
  $('#pomodoro-toggle').addEventListener('click', togglePomodoro);
}

function renderQuickLinks() {
  const links = settings.quickLinks?.length ? settings.quickLinks : DEFAULT_SETTINGS.quickLinks;
  const icons = { chatgpt: '✧', perplexity: 'P', whatsapp: '◌', github: '◈' };
  $('#quick-links').innerHTML = links.map((link) => `<a class="quick-card" href="${link.url}" target="_blank" rel="noreferrer"><span class="quick-icon ${link.tone}">${icons[link.id] || '↗'}</span><strong>${escapeHtml(link.label)}</strong></a>`).join('');
}

function renderNotes() {
  $('#notes-count').textContent = notes.length;
  $('#notes-list').innerHTML = notes.length ? notes.map((note) => `<article class="note-item"><button class="note-delete" data-note="${note.id}" title="Supprimer">×</button>${escapeHtml(note.text)}<small>${new Date(note.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</small></article>`).join('') : '<div class="empty-state">Aucune note pour le moment. Capturez une idée avant de la perdre.</div>';
  $$('.note-delete').forEach((button) => button.addEventListener('click', async () => { notes = notes.filter((note) => note.id !== button.dataset.note); await saveNotes(notes); renderNotes(); showToast('Note supprimée'); }));
}

async function saveNote() {
  const input = $('#note-input'); const text = input.value.trim();
  if (!text) return showToast('Écrivez une note avant de l’enregistrer.');
  notes.unshift({ id: crypto.randomUUID(), text, createdAt: Date.now() }); await saveNotes(notes); input.value = ''; renderNotes(); showToast('Note enregistrée localement');
}

async function runPageAction(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith('chrome://')) return showToast('Cette page ne permet pas cette action.');
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type });
    if (type === MESSAGE_TYPES.summarizePage) { showView('notes'); $('#note-input').value = response.summary || 'Résumé indisponible.'; showToast('Résumé prêt à être enregistré'); }
    else showToast(`${response.count || 0} élément(s) anonymisé(s)`);
  } catch { showToast('Impossible d’analyser cette page. Rechargez-la puis réessayez.'); }
}

async function closeDuplicates() {
  const response = await chrome.runtime.sendMessage({ type: 'tabs/close-duplicates' });
  showToast(`${response.closed || 0} onglet(s) doublon(s) fermé(s)`);
}

function runSearch() { const query = $('#search-input').value.trim(); if (query) chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }); }

function togglePomodoro() {
  if (pomodoro.status === 'running') { pomodoro.status = 'paused'; clearInterval(pomodoroTimer); $('#pomodoro-toggle').textContent = 'Reprendre'; }
  else { pomodoro.status = 'running'; $('#pomodoro-toggle').textContent = 'Pause'; clearInterval(pomodoroTimer); pomodoroTimer = setInterval(() => { pomodoro.remaining -= 1; renderPomodoro(); if (pomodoro.remaining <= 0) { clearInterval(pomodoroTimer); pomodoro.status = 'done'; $('#pomodoro-toggle').textContent = 'Recommencer'; showToast('Session terminée, bravo.'); } }, 1000); }
  renderPomodoro();
}

function renderPomodoro() { const minutes = Math.floor(Math.max(0, pomodoro.remaining) / 60); const seconds = Math.max(0, pomodoro.remaining) % 60; $('#pomodoro-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; $('#pomodoro-label').textContent = pomodoro.status === 'running' ? 'Restez concentré.' : pomodoro.status === 'done' ? 'Session terminée. Faites une pause.' : '25 minutes pour avancer.'; }
function applyTheme(theme) { document.body.classList.toggle('light-theme', theme === 'light'); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
