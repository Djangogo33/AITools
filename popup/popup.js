import { DEFAULT_SETTINGS, MESSAGE_TYPES, getQuickLinks, getSettings, saveSettings } from '../shared/constants.js';
import { SEARCH_PRESETS, buildGoogleUrl, clearSearchHistory, getSearchHistory, saveSearch } from '../shared/search-service.js';
import { analyzeAIProbability, getAIStatus, paletteFromText, summarizeWithAI, translateWithAI } from './ai-runtime.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let settings = { ...DEFAULT_SETTINGS };
let notes = [];
let pomodoro = { status: 'idle', remaining: 1500, notifications: true };
let pomodoroTimer;
let account = { authenticated: false, user: null, plan: 'free', entitlements: [] };
let searchCategory = 'web';

init();

async function init() {
  settings = await getSettings();
  await loadNotes();
  applyTheme(settings.theme);
  $('#dark-mode-setting').checked = settings.theme === 'dark';
  $('#notifications-setting').checked = settings.notifications !== false;
  $('#compact-setting').checked = settings.compactMode === true;
  renderQuickLinks();
  renderShortcutEditor();
  renderSearchOperators();
  await renderSearchHistory();
  renderNotes();
  bindNavigation();
  bindActions();
  await refreshAccount();
  await loadNotes();
  await loadReadingList();
  await refreshPomodoro();
  await refreshTabStats();
  await refreshAIStatus();
}

function bindNavigation() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  $('#account-shortcut').addEventListener('click', () => showView('settings'));
}

function showView(view) {
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  $$('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
  const titles = { home: ['VOTRE ESPACE DE TRAVAIL', 'Bonjour, Alex'], search: ['RECHERCHE UNIVERSELLE', 'Rechercher mieux'], tools: ['BOÎTE À OUTILS', 'Travaillez plus vite'], ai: ['IA LOCALE ET PRIVÉE', 'Analyse assistée'], notes: ['VOTRE CARNET', 'Notes rapides'], settings: ['PERSONNALISATION', 'Préférences'] };
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
  $$('.category-chip').forEach((button) => button.addEventListener('click', () => { searchCategory = button.dataset.category; $$('.category-chip').forEach((chip) => chip.classList.toggle('active', chip === button)); }));
  $('#clear-search-history').addEventListener('click', async () => { await clearSearchHistory(); await renderSearchHistory(); });
  $('#add-shortcut').addEventListener('click', addShortcut);
  $('#ai-from-page').addEventListener('click', fillAIFromPage);
  $('#ai-summarize').addEventListener('click', runAISummary);
  $('#ai-translate').addEventListener('click', runAITranslation);
  $('#ai-detect').addEventListener('click', runAIAnalysis);
  $('#ai-palette').addEventListener('click', runAIPalette);
  $('#ai-copy').addEventListener('click', copyAIResult);
  $('#youtube-theater').addEventListener('click', () => runYouTubeAction('page/youtube-theater'));
  $('#youtube-speed').addEventListener('click', () => runYouTubeAction('page/youtube-speed'));
  $('#home-summarize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.summarizePage));
  $('#home-note').addEventListener('click', () => { showView('notes'); $('#note-input').focus(); });
  $('#tool-summarize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.summarizePage));
  $('#tool-anonymize').addEventListener('click', () => runPageAction(MESSAGE_TYPES.anonymizePage));
  $('#tool-duplicates').addEventListener('click', closeDuplicates);
  $('#tool-group-tabs').addEventListener('click', groupTabsByDomain);
  $('#tool-reading').addEventListener('click', () => runProductivityAction(MESSAGE_TYPES.getReadingTime));
  $('#tool-focus').addEventListener('click', () => runProductivityAction(MESSAGE_TYPES.toggleFocus));
  $('#tool-highlight').addEventListener('click', () => runProductivityAction(MESSAGE_TYPES.highlightSelection));
  $('#tool-print').addEventListener('click', () => runProductivityAction(MESSAGE_TYPES.printPage));
  $('#save-note').addEventListener('click', saveNote);
  $('#sync-notes').addEventListener('click', syncNotesNow);
  $('#import-local-notes').addEventListener('click', importLocalNotes);
  $('#save-current-page').addEventListener('click', saveCurrentPageToReadingList);
  $('#pomodoro-toggle').addEventListener('click', togglePomodoro);
  $('#pomodoro-reset').addEventListener('click', resetPomodoro);
  $('#auth-action').addEventListener('click', handleAuthAction);
  $('#upgrade-pro').addEventListener('click', () => startCheckout('pro'));
  $('#upgrade-max').addEventListener('click', () => startCheckout('max'));
  $('#manage-billing').addEventListener('click', openBillingPortal);
  $('#sign-out').addEventListener('click', handleSignOut);
}

async function refreshAccount() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'auth/get-account' });
    if (!response?.ok) throw new Error(response?.error || 'Compte indisponible');
    account = response.data;
  } catch {
    account = { authenticated: false, user: null, plan: 'free', entitlements: [] };
  }
  renderAccount();
}

function renderAccount() {
  const user = account.user;
  const initial = String(user?.name || 'A').trim().charAt(0).toUpperCase() || 'A';
  $('#account-name').textContent = user ? user.name : 'Utiliser en mode local';
  $('#account-email').textContent = user ? user.email : 'Vos outils et notes restent disponibles sans compte.';
  $('#account-plan').textContent = user ? `PLAN ${String(account.plan || 'free').toUpperCase()}` : 'PLAN LOCAL';
  $('#account-hint').textContent = user ? `Session sécurisée avec Supabase${account.expiresAt ? ` · accès jusqu’au ${new Date(account.expiresAt).toLocaleDateString('fr-FR')}` : ''}.` : 'Connectez-vous pour synchroniser votre profil et accéder à vos fonctionnalités distantes.';
  $('#auth-action').textContent = user ? 'Actualiser le compte' : 'Se connecter avec Google';
  $('#sign-out').classList.toggle('hidden', !user);
  $('#billing-actions').classList.toggle('hidden', !user);
  $('#upgrade-pro').classList.toggle('hidden', !user || account.plan === 'pro' || account.plan === 'max');
  $('#upgrade-max').classList.toggle('hidden', !user || account.plan === 'max');
  $('#sidebar-avatar').textContent = initial;
  $('#account-avatar').textContent = initial;
  $('#sidebar-account-name').textContent = user ? user.name : 'Mode local';
  $('#sidebar-account-status').textContent = user ? `Plan ${String(account.plan || 'free').toUpperCase()}` : 'Prêt à travailler';
  $('#sidebar-account-dot').style.background = user ? 'var(--green)' : 'var(--faint)';
  [$('#sidebar-avatar'), $('#account-avatar')].forEach((element) => {
    element.classList.toggle('has-image', Boolean(user?.avatarUrl));
    element.style.backgroundImage = user?.avatarUrl ? `url(${JSON.stringify(user.avatarUrl)})` : '';
  });
}

async function handleAuthAction() {
  if (account.authenticated) return refreshAccount();
  const button = $('#auth-action'); const previous = button.textContent;
  button.disabled = true; button.textContent = 'Connexion en cours…';
  try {
    const response = await chrome.runtime.sendMessage({ type: 'auth/sign-in-google' });
    if (!response?.ok) throw new Error(response?.error || 'Connexion impossible.');
    account = response.data; renderAccount(); await loadNotes(); showToast('Connexion réussie.');
  } catch (error) { showToast(error.message || 'Connexion impossible.'); }
  finally { button.disabled = false; if (!account.authenticated) button.textContent = previous; }
}

async function startCheckout(plan) {
  const response = await chrome.runtime.sendMessage({ type: 'billing/create-checkout', plan });
  if (!response?.ok) return showToast(response?.error || 'Paiement indisponible.');
  await chrome.tabs.create({ url: response.data });
  showToast('Ouverture sécurisée du paiement Stripe.');
}

async function openBillingPortal() {
  const response = await chrome.runtime.sendMessage({ type: 'billing/create-portal' });
  if (!response?.ok) return showToast(response?.error || 'Portail de facturation indisponible.');
  await chrome.tabs.create({ url: response.data });
}

async function handleSignOut() {
  const response = await chrome.runtime.sendMessage({ type: 'auth/sign-out' });
  if (!response?.ok) return showToast(response?.error || 'Déconnexion impossible.');
  account = response.data; renderAccount(); await loadNotes(); showToast('Vous êtes déconnecté.');
}

function activeShortcuts() { return getQuickLinks(settings); }

function renderQuickLinks() {
  const icons = { chatgpt: '✧', perplexity: 'P', whatsapp: '◌', github: '◈' };
  $('#quick-links').innerHTML = activeShortcuts().map((link) => `<a class="quick-card" href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer"><span class="quick-icon ${escapeAttribute(link.tone || 'slate')}">${icons[link.id] || '↗'}</span><strong>${escapeHtml(link.label)}</strong></a>`).join('');
}

function renderShortcutEditor() {
  const links = activeShortcuts();
  $('#shortcuts-list').innerHTML = links.map((link, index) => `<div class="shortcut-item"><span><strong>${escapeHtml(link.label)}</strong><small>${escapeHtml(link.url)}</small></span><button class="shortcut-delete" data-shortcut="${index}" title="Supprimer">×</button></div>`).join('');
  $$('.shortcut-delete').forEach((button) => button.addEventListener('click', async () => { const links = activeShortcuts().filter((_, index) => index !== Number(button.dataset.shortcut)); settings = await saveSettings({ quickLinks: links }); renderQuickLinks(); renderShortcutEditor(); showToast('Raccourci supprimé.'); }));
}

async function addShortcut() {
  const label = $('#shortcut-label').value.trim(); const value = $('#shortcut-url').value.trim();
  if (!label || !value) return showToast('Indiquez un nom et une URL.');
  let url; try { url = new URL(value); } catch { return showToast('L’URL saisie est invalide.'); }
  if (!['https:', 'http:'].includes(url.protocol)) return showToast('Utilisez une URL http ou https.');
  const tones = ['violet', 'blue', 'green', 'slate']; const links = [...activeShortcuts(), { id: crypto.randomUUID(), label: label.slice(0, 24), url: url.toString(), tone: tones[activeShortcuts().length % tones.length] }];
  settings = await saveSettings({ quickLinks: links }); $('#shortcut-label').value = ''; $('#shortcut-url').value = ''; renderQuickLinks(); renderShortcutEditor(); showToast('Raccourci ajouté.');
}

async function refreshAIStatus() {
  const status = await getAIStatus();
  const entries = Object.entries(status).filter(([key]) => key !== 'local');
  const available = entries.filter(([, value]) => value !== 'unavailable').length;
  $('#ai-status').textContent = available ? `${available} capacité(s) IA locale(s) disponible(s) · vos textes restent dans Chrome.` : 'Les API IA locales ne sont pas disponibles ; les outils déterministes restent utilisables.';
  $('#ai-status-dot').textContent = available ? '●' : '·';
  $('#ai-status-dot').style.color = available ? 'var(--green)' : 'var(--faint)';
}

async function getAIInput() {
  const ownText = $('#ai-input').value.trim();
  if (ownText) return ownText;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith('chrome://')) throw new Error('Cette page ne peut pas être analysée.');
  const response = await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.getPageText });
  if (!response?.ok || !response.text) throw new Error('Aucun texte lisible trouvé sur cette page.');
  return response.text;
}

async function fillAIFromPage() {
  try { const text = await getAIInput(); $('#ai-input').value = text; showToast('Texte de la page chargé.'); } catch (error) { showToast(error.message); }
}

async function runAISummary() { await runAIJob(async (text) => summarizeWithAI(text), (result) => { setAIResult(result.text, result.engine); }); }
async function runAITranslation() { await runAIJob(async (text) => translateWithAI(text, $('#ai-target-language').value), (result) => { setAIResult(result.text, result.engine); }); }
async function runAIAnalysis() { await runAIJob(async (text) => analyzeAIProbability(text), (result) => { setAIResult(`Indice stylistique : ${result.score}/100 (${result.confidence})\n\nMots analysés : ${result.indicators.words}\nDiversité lexicale : ${result.indicators.uniqueRatio}\nLongueur moyenne des phrases : ${result.indicators.averageSentenceLength}\nConnecteurs structurants : ${result.indicators.connectors}\nRépétitions d’amorces : ${result.indicators.repetition}\n\n${result.disclaimer}`, 'analyse heuristique'); }); }
async function runAIPalette() { const source = $('#ai-input').value.trim() || 'AITools'; const palette = paletteFromText(source); setAIResult(palette.map((color) => `■ ${color}`).join('\n'), 'générateur local'); }

async function runAIJob(task, render) {
  const buttons = $$('.ai-actions button'); buttons.forEach((button) => { button.disabled = true; }); $('#ai-engine').textContent = 'Traitement en cours…';
  try { const result = await task(await getAIInput()); render(result); } catch (error) { setAIResult(error.message || 'Traitement IA impossible.', 'indisponible'); }
  finally { buttons.forEach((button) => { button.disabled = false; }); }
}

function setAIResult(text, engine) { $('#ai-result').textContent = text; $('#ai-engine').textContent = `Moteur : ${engine}`; }
async function copyAIResult() { const text = $('#ai-result').textContent; if (!text || text === 'Le résultat apparaîtra ici.') return; try { await navigator.clipboard.writeText(text); showToast('Résultat copié.'); } catch { showToast('Copie impossible.'); } }
async function runYouTubeAction(type) { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (!tab?.id || !/youtube\.com/i.test(tab.url || '')) return showToast('Ouvrez une vidéo YouTube pour utiliser ce contrôle.'); try { const response = await chrome.tabs.sendMessage(tab.id, { type }); if (!response?.ok) throw new Error(response?.error); showToast(response.message || 'Réglage YouTube appliqué.'); } catch { showToast('Contrôle YouTube indisponible sur cette page.'); } }

async function loadNotes() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'notes/list' });
    if (!response?.ok) throw new Error(response?.error || 'Notes indisponibles');
    notes = response.data;
  } catch { notes = []; }
  renderNotes();
}

function renderNotes() {
  $('#notes-count').textContent = notes.length;
  $('#notes-mode').textContent = account.authenticated ? 'Synchronisées avec votre compte' : 'Stockage local et privé';
  $('#sync-notes').classList.toggle('hidden', !account.authenticated);
  $('#import-local-notes').classList.toggle('hidden', !account.authenticated);
  $('#notes-list').innerHTML = notes.length ? notes.map((note) => `<article class="note-item"><button class="note-delete" data-note="${note.id}" title="Supprimer">×</button>${escapeHtml(note.content)}<small>${new Date(note.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</small></article>`).join('') : '<div class="empty-state">Aucune note pour le moment. Capturez une idée avant de la perdre.</div>';
  $$('.note-delete').forEach((button) => button.addEventListener('click', async () => { const response = await chrome.runtime.sendMessage({ type: 'notes/delete', noteId: button.dataset.note }); if (!response?.ok) return showToast(response?.error || 'Suppression impossible.'); await loadNotes(); showToast(response.data?.pending ? 'Suppression locale ; synchronisation en attente.' : 'Note supprimée.'); }));
}

async function saveNote() {
  const input = $('#note-input'); const content = input.value.trim();
  if (!content) return showToast('Écrivez une note avant de l’enregistrer.');
  const response = await chrome.runtime.sendMessage({ type: 'notes/create', content });
  if (!response?.ok) return showToast(response?.error || 'Enregistrement impossible.');
  input.value = ''; await loadNotes(); showToast(account.authenticated ? (response.data?.pending ? 'Note enregistrée localement ; synchronisation en attente.' : 'Note synchronisée.') : 'Note enregistrée localement.');
}

async function syncNotesNow() {
  const response = await chrome.runtime.sendMessage({ type: 'notes/sync' });
  if (!response?.ok) return showToast(response?.error || 'Synchronisation impossible.');
  await loadNotes(); showToast(`${response.data.count} note(s) synchronisée(s).`);
}

async function importLocalNotes() {
  const response = await chrome.runtime.sendMessage({ type: 'notes/import-guest' });
  if (!response?.ok) return showToast(response?.error || 'Import impossible.');
  await loadNotes(); showToast(`${response.data.imported} note(s) locale(s) importée(s).`);
}

async function loadReadingList() {
  const response = await chrome.runtime.sendMessage({ type: 'reading/list' });
  const items = response?.ok ? response.data : [];
  $('#reading-list').innerHTML = items.length ? items.map((item) => `<article class="reading-item ${item.done ? 'done' : ''}"><button class="reading-toggle" data-reading-toggle="${escapeAttribute(item.id)}" title="${item.done ? 'Marquer à lire' : 'Marquer comme lu'}">${item.done ? '✓' : '○'}</button><a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(new URL(item.url).hostname)}</small></a><button class="reading-remove" data-reading-remove="${escapeAttribute(item.id)}" title="Supprimer">×</button></article>`).join('') : '<p class="history-empty">Aucune page enregistrée. Ajoutez votre onglet actif pour le retrouver ici.</p>';
  $$('[data-reading-toggle]').forEach((button) => button.addEventListener('click', async () => { const result = await chrome.runtime.sendMessage({ type: 'reading/toggle', itemId: button.dataset.readingToggle }); if (!result?.ok) return showToast(result?.error || 'Mise à jour impossible.'); await loadReadingList(); }));
  $$('[data-reading-remove]').forEach((button) => button.addEventListener('click', async () => { const result = await chrome.runtime.sendMessage({ type: 'reading/remove', itemId: button.dataset.readingRemove }); if (!result?.ok) return showToast(result?.error || 'Suppression impossible.'); await loadReadingList(); showToast('Page retirée de la liste.'); }));
}

async function saveCurrentPageToReadingList() {
  const response = await chrome.runtime.sendMessage({ type: 'reading/save-current' });
  if (!response?.ok) return showToast(response?.error || 'Ajout impossible.');
  await loadReadingList();
  showToast(response.data.created ? 'Page ajoutée à la liste de lecture.' : 'Cette page figure déjà dans votre liste.');
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

async function runProductivityAction(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith('chrome://')) return showToast('Cette page ne permet pas cette action.');
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type });
    if (!response?.ok) throw new Error(response?.error || 'Action indisponible.');
    if (type === MESSAGE_TYPES.getReadingTime) { $('#reading-status').textContent = `${response.minutes} min · ${response.words.toLocaleString('fr-FR')} mots`; return showToast(`Temps de lecture estimé : ${response.minutes} min.`); }
    if (type === MESSAGE_TYPES.toggleFocus) { $('#focus-status').textContent = response.enabled ? 'Mode concentration activé' : 'Mode concentration désactivé'; return showToast(response.enabled ? 'Mode concentration activé.' : 'Mode concentration désactivé.'); }
    if (type === MESSAGE_TYPES.highlightSelection) return showToast(response.highlighted ? 'Sélection surlignée.' : 'Sélectionnez du texte dans la page avant de surligner.');
    if (type === MESSAGE_TYPES.printPage) return showToast('Boîte d’impression ouverte. Choisissez « Enregistrer au format PDF ».');
  } catch { showToast('Impossible d’utiliser cet outil sur la page actuelle. Rechargez-la puis réessayez.'); }
}

async function closeDuplicates() {
  const response = await chrome.runtime.sendMessage({ type: 'tabs/close-duplicates' });
  if (!response?.ok) return showToast(response?.error || 'Nettoyage impossible.');
  await refreshTabStats(); showToast(`${response.data?.closed || 0} onglet(s) doublon(s) fermé(s)`);
}

async function groupTabsByDomain() {
  const response = await chrome.runtime.sendMessage({ type: 'tabs/group-by-domain' });
  if (!response?.ok) return showToast(response?.error || 'Regroupement impossible.');
  await refreshTabStats(); showToast(`${response.data?.groups || 0} groupe(s) créé(s).`);
}

async function refreshTabStats() {
  const response = await chrome.runtime.sendMessage({ type: 'tabs/get-stats' });
  if (!response?.ok) return;
  const { total, duplicates } = response.data;
  $('#tabs-status').textContent = `${total} onglet(s) · ${duplicates} doublon(s) détecté(s)`;
}

async function runSearch() { const query = $('#search-input').value.trim(); if (!query) return; await saveSearch(query); await renderSearchHistory(); chrome.tabs.create({ url: buildGoogleUrl(query, searchCategory) }); }

function renderSearchOperators() {
  $('#operator-grid').innerHTML = SEARCH_PRESETS.map((preset, index) => `<button data-preset="${index}">${escapeHtml(preset.label)} <small>${escapeHtml(preset.query || 'web')}</small></button>`).join('');
  $$('#operator-grid button').forEach((button) => button.addEventListener('click', () => { const preset = SEARCH_PRESETS[Number(button.dataset.preset)]; const input = $('#search-input'); input.value = preset.query === '""' ? `${input.value}""` : `${preset.query}${input.value}`; input.focus(); }));
}

async function renderSearchHistory() {
  const history = await getSearchHistory();
  $('#search-history').innerHTML = history.length ? history.map((query) => `<button class="history-item" data-history="${escapeHtml(query)}">↗ <span>${escapeHtml(query)}</span></button>`).join('') : '<p class="history-empty">Vos dernières recherches apparaîtront ici.</p>';
  $$('.history-item').forEach((button) => button.addEventListener('click', () => { $('#search-input').value = button.dataset.history; $('#search-input').focus(); }));
}

async function refreshPomodoro() {
  const response = await chrome.runtime.sendMessage({ type: 'pomodoro/get' });
  if (!response?.ok) return;
  pomodoro = response.data; renderPomodoro();
  clearInterval(pomodoroTimer);
  if (pomodoro.status === 'running') pomodoroTimer = setInterval(refreshPomodoro, 1000);
}

async function togglePomodoro() {
  const response = await chrome.runtime.sendMessage({ type: 'pomodoro/toggle', durationMinutes: 25, cycle: 'focus' });
  if (!response?.ok) return showToast(response?.error || 'Pomodoro indisponible.');
  pomodoro = response.data; renderPomodoro();
  clearInterval(pomodoroTimer);
  if (pomodoro.status === 'running') pomodoroTimer = setInterval(refreshPomodoro, 1000);
}

async function resetPomodoro() {
  const response = await chrome.runtime.sendMessage({ type: 'pomodoro/reset', durationMinutes: 25, cycle: 'focus' });
  if (!response?.ok) return showToast(response?.error || 'Réinitialisation impossible.');
  pomodoro = response.data; clearInterval(pomodoroTimer); renderPomodoro(); showToast('Pomodoro réinitialisé.');
}

function renderPomodoro() { const remaining = pomodoro.status === 'running' && pomodoro.endAt ? Math.max(0, pomodoro.endAt - Date.now()) : pomodoro.remainingMs; const minutes = Math.floor(Math.max(0, remaining) / 60_000); const seconds = Math.floor((Math.max(0, remaining) % 60_000) / 1000); $('#pomodoro-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; $('#pomodoro-label').textContent = pomodoro.status === 'running' ? 'Restez concentré.' : pomodoro.status === 'paused' ? 'Session en pause.' : pomodoro.status === 'done' ? 'Session terminée. Faites une pause.' : '25 minutes pour avancer.'; $('#pomodoro-toggle').textContent = pomodoro.status === 'running' ? 'Pause' : pomodoro.status === 'paused' ? 'Reprendre' : pomodoro.status === 'done' ? 'Recommencer' : 'Démarrer'; }
function applyTheme(theme) { document.body.classList.toggle('light-theme', theme === 'light'); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
