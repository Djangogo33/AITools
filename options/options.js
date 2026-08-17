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
  bindActions(); await Promise.all([renderAIStatus(), renderAccount()]);
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
  $('#option-export').addEventListener('click', exportLocalData);
  $('#option-import-file').addEventListener('click', () => $('#option-import-input').click());
  $('#option-import-input').addEventListener('change', importLocalData);
  $('#option-reset').addEventListener('click', resetLocalData);
  $('#option-refresh-ai').addEventListener('click', renderAIStatus);
}

async function saveSetting(patch) { await saveSettings(patch); showToast('Préférence enregistrée.'); }
async function renderAIStatus() { const status = await getAIStatus(); $('#ai-diagnostic').innerHTML = Object.entries(status).filter(([name]) => name !== 'local').map(([name, value]) => `<article class="diagnostic-item ${value !== 'unavailable' ? 'available' : ''}"><small>${name.toUpperCase()}</small><strong>${value === 'unavailable' ? 'Indisponible' : String(value)}</strong></article>`).join(''); }
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
