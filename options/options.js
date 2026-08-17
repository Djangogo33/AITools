import { getPomodoroMinutes, getSettings, saveSettings } from '../shared/constants.js';
import { getAIStatus } from '../popup/ai-runtime.js';

const $ = (selector) => document.querySelector(selector);

init();

async function init() {
  const settings = await getSettings();
  $('#option-theme').checked = settings.theme === 'dark';
  $('#option-compact').checked = settings.compactMode === true;
  $('#option-notifications').checked = settings.notifications !== false;
  $('#option-pomodoro-duration').value = getPomodoroMinutes(settings);
  bindActions(); await Promise.all([renderAIStatus(), renderAccount(), renderFocusStats(), renderDndSettings(), renderTabRules()]);
}

function bindActions() {
  $('#option-theme').addEventListener('change', (event) => saveSetting({ theme: event.target.checked ? 'dark' : 'light' }));
  $('#option-compact').addEventListener('change', (event) => saveSetting({ compactMode: event.target.checked }));
  $('#option-notifications').addEventListener('change', (event) => saveSetting({ notifications: event.target.checked }));
  $('#option-pomodoro-duration').addEventListener('change', async (event) => { const settings = await saveSettings({ pomodoroMinutes: event.target.value }); event.target.value = getPomodoroMinutes(settings); showToast(`Durée Pomodoro définie à ${event.target.value} minutes.`); });
  $('#option-page-dark').addEventListener('click', () => runPageAction('page/toggle-dark', 'Mode sombre de la page mis à jour.'));
  $('#option-cookies').addEventListener('click', () => runPageAction('page/dismiss-cookies', 'Bannières de consentement masquées.'));
  $('#option-sponsored').addEventListener('click', () => runPageAction('page/block-sponsored', 'Résultats sponsorisés masqués.'));
  $('#option-sync-notes').addEventListener('click', () => runBackgroundAction('notes/sync', (data) => `${data.count} note(s) synchronisée(s).`));
  $('#option-import-notes').addEventListener('click', () => runBackgroundAction('notes/import-guest', (data) => `${data.imported} note(s) locale(s) importée(s).`));
  $('#option-sync-personal').addEventListener('click', () => runBackgroundAction('personal/sync', (data) => `${data.tasks.count} tâche(s) et ${data.reading.count} page(s) synchronisées.`));
  $('#option-export').addEventListener('click', exportLocalData);
  $('#option-export-markdown').addEventListener('click', () => exportStructuredData('markdown'));
  $('#option-export-csv').addEventListener('click', () => exportStructuredData('csv'));
  $('#option-import-file').addEventListener('click', () => $('#option-import-input').click());
  $('#option-import-input').addEventListener('change', importLocalData);
  $('#option-reset').addEventListener('click', resetLocalData);
  $('#option-refresh-ai').addEventListener('click', renderAIStatus);
  $('#option-refresh-focus').addEventListener('click', renderFocusStats);
  $('#option-save-dnd').addEventListener('click', saveDndSettings);
  $('#option-add-tab-rule').addEventListener('click', createTabRule);
  $('#option-apply-tab-rules').addEventListener('click', applyTabRules);
}

async function saveSetting(patch) { await saveSettings(patch); showToast('Préférence enregistrée.'); }
async function renderAIStatus() { const status = await getAIStatus(); $('#ai-diagnostic').innerHTML = Object.entries(status).filter(([name]) => name !== 'local').map(([name, value]) => `<article class="diagnostic-item ${value !== 'unavailable' ? 'available' : ''}"><small>${name.toUpperCase()}</small><strong>${value === 'unavailable' ? 'Indisponible' : String(value)}</strong></article>`).join(''); }
async function renderFocusStats() { try { const response = await chrome.runtime.sendMessage({ type: 'focus/stats', days: 7 }); const stats = response?.data; if (!stats) throw new Error(); $('#focus-diagnostic').innerHTML = [`<article class="diagnostic-item available"><small>SESSIONS</small><strong>${stats.sessions}</strong></article>`, `<article class="diagnostic-item available"><small>MINUTES</small><strong>${stats.minutes}</strong></article>`, `<article class="diagnostic-item available"><small>MOYENNE</small><strong>${stats.averageMinutes} min</strong></article>`].join(''); } catch { $('#focus-diagnostic').textContent = 'Statistiques indisponibles.'; } }
async function renderDndSettings() { try { const response = await chrome.runtime.sendMessage({ type: 'focus/get-dnd' }); const settings = response?.data || { enabled: false, domains: [] }; $('#option-dnd-enabled').checked = settings.enabled; $('#option-dnd-domains').value = (settings.domains || []).join(', '); } catch { showToast('Réglages Ne pas déranger indisponibles.'); } }
async function saveDndSettings() { const response = await chrome.runtime.sendMessage({ type: 'focus/save-dnd', patch: { enabled: $('#option-dnd-enabled').checked, domains: $('#option-dnd-domains').value } }); if (!response?.ok) return showToast(response?.error || 'Enregistrement impossible.'); $('#option-dnd-domains').value = response.data.domains.join(', '); showToast(`${response.data.domains.length} domaine(s) enregistrés.`); }
async function renderTabRules() { try { const response = await chrome.runtime.sendMessage({ type: 'tab-rules/list' }); const rules = response?.data || []; $('#tab-rules-list').innerHTML = rules.length ? rules.map((rule) => `<div class="tab-rule"><span><strong>${escapeHtml(rule.domain)}</strong><small>${rule.enabled ? 'Active' : 'Suspendue'}</small></span><button data-rule-toggle="${escapeHtml(rule.id)}">${rule.enabled ? 'Suspendre' : 'Activer'}</button><button data-rule-remove="${escapeHtml(rule.id)}">×</button></div>`).join('') : 'Aucune règle configurée.'; document.querySelectorAll('[data-rule-toggle]').forEach((button) => button.addEventListener('click', async () => { const response = await chrome.runtime.sendMessage({ type: 'tab-rules/toggle', ruleId: button.dataset.ruleToggle }); if (!response?.ok) return showToast(response?.error || 'Action impossible.'); await renderTabRules(); })); document.querySelectorAll('[data-rule-remove]').forEach((button) => button.addEventListener('click', async () => { const response = await chrome.runtime.sendMessage({ type: 'tab-rules/remove', ruleId: button.dataset.ruleRemove }); if (!response?.ok) return showToast(response?.error || 'Suppression impossible.'); await renderTabRules(); })); } catch { $('#tab-rules-list').textContent = 'Règles indisponibles.'; } }
async function createTabRule() { const domain = $('#option-rule-domain').value.trim(); const response = await chrome.runtime.sendMessage({ type: 'tab-rules/create', domain, color: $('#option-rule-color').value }); if (!response?.ok) return showToast(response?.error || 'Création impossible.'); $('#option-rule-domain').value = ''; await renderTabRules(); showToast(response.data.created ? 'Règle ajoutée.' : 'Cette règle existe déjà.'); }
async function applyTabRules() { const response = await chrome.runtime.sendMessage({ type: 'tab-rules/apply' }); if (!response?.ok) return showToast(response?.error || 'Application impossible.'); showToast(`${response.data.groups} groupe(s) créés pour ${response.data.matchedTabs} onglet(s).`); }
async function renderAccount() { try { const response = await chrome.runtime.sendMessage({ type: 'auth/get-account' }); const account = response?.data; $('#account-diagnostic').innerHTML = account?.authenticated ? `<strong>${escapeHtml(account.user.name)}</strong><br>${escapeHtml(account.user.email)}<br>Plan : <strong>${escapeHtml(String(account.plan).toUpperCase())}</strong>` : 'Vous utilisez AITools en mode local. Connectez-vous depuis le popup pour synchroniser votre profil et vos notes.'; } catch { $('#account-diagnostic').textContent = 'État de compte indisponible.'; } }
async function runBackgroundAction(type, formatter) { const response = await chrome.runtime.sendMessage({ type }); if (!response?.ok) return showToast(response?.error || 'Action impossible.'); showToast(formatter(response.data)); }
async function runPageAction(type, success) { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (!tab?.id || tab.url?.startsWith('chrome://')) return showToast('Cette page ne permet pas cette action.'); try { const response = await chrome.tabs.sendMessage(tab.id, { type }); if (!response?.ok) throw new Error(response?.error); showToast(success); } catch { showToast('Action indisponible : rechargez la page puis réessayez.'); } }
async function exportLocalData() {
  const data = await chrome.storage.local.get(null);
  const entries = Object.entries(data).filter(([key]) => key.startsWith('aitools.') && !['aitools.auth.session', 'aitools.auth.pkce-verifier', 'aitools.auth.account-cache'].includes(key));
  const payload = { format: 'aitools-export', version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `aitools-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  showToast('Export téléchargé. Les jetons de session sont exclus.');
}

async function exportStructuredData(format) {
  const response = await chrome.runtime.sendMessage({ type: 'export/create', format });
  if (!response?.ok) return showToast(response?.error || 'Export impossible.');
  const file = response.data; const blob = new Blob([file.content], { type: file.mime }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = file.filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1_000);
  showToast(`Export ${format === 'csv' ? 'CSV' : 'Markdown'} téléchargé.`);
}

async function importLocalData(event) {
  const file = event.target.files?.[0]; event.target.value = '';
  if (!file) return;
  if (file.size > 2_000_000) return showToast('La sauvegarde dépasse la limite de 2 Mo.');
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.format !== 'aitools-export' || !payload?.data || typeof payload.data !== 'object') throw new Error('Format non reconnu.');
    const data = Object.fromEntries(Object.entries(payload.data).filter(([key]) => key.startsWith('aitools.') && !key.startsWith('aitools.auth.')));
    if (!Object.keys(data).length) throw new Error('Aucune donnée AITools valide trouvée.');
    if (!confirm(`Restaurer ${Object.keys(data).length} espace(s) de données locales ? Les données locales de même nom seront remplacées. Les sessions ne sont jamais importées.`)) return;
    await chrome.storage.local.set(data);
    showToast('Sauvegarde restaurée. Rechargement de l’interface…');
    setTimeout(() => location.reload(), 800);
  } catch (error) { showToast(error.message || 'Import impossible.'); }
}

async function resetLocalData() { if (!confirm('Réinitialiser les préférences, les notes locales et le Pomodoro ? Cette action ne supprime pas les données déjà synchronisées.')) return; const keys = await chrome.storage.local.get(null); const removable = Object.keys(keys).filter((key) => key.startsWith('aitools.')); await chrome.storage.local.remove(removable); showToast('Données locales réinitialisées. Rechargez l’extension.'); }
function showToast(message) { const toast = $('#options-toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3000); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
