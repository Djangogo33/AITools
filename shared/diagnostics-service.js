const DIAGNOSTICS_KEY = 'aitools.diagnostics';
const MAX_EVENTS = 200;

export async function recordDiagnostic(kind, message, level = 'info') {
  const event = { id: crypto.randomUUID(), at: new Date().toISOString(), kind: String(kind || 'system').slice(0, 80), level: ['info', 'warning', 'error'].includes(level) ? level : 'info', message: sanitize(message) };
  const current = await listDiagnostics(); await chrome.storage.local.set({ [DIAGNOSTICS_KEY]: [event, ...current].slice(0, MAX_EVENTS) }); return event;
}

export async function listDiagnostics(limit = 100) { const stored = await chrome.storage.local.get(DIAGNOSTICS_KEY); const entries = Array.isArray(stored[DIAGNOSTICS_KEY]) ? stored[DIAGNOSTICS_KEY] : []; return entries.filter((item) => validDate(item?.at) && item?.id).slice(0, Math.max(1, Math.min(MAX_EVENTS, Number(limit) || 100))).map((item) => ({ id: String(item.id), at: new Date(item.at).toISOString(), kind: String(item.kind || 'system').slice(0, 80), level: ['info', 'warning', 'error'].includes(item.level) ? item.level : 'info', message: sanitize(item.message) })); }

export async function createDiagnosticsExport() { const events = await listDiagnostics(MAX_EVENTS); return { filename: `aitools-diagnostic-${new Date().toISOString().slice(0, 10)}.json`, mime: 'application/json', content: JSON.stringify({ format: 'aitools-diagnostics', version: 1, exportedAt: new Date().toISOString(), privacy: 'Le journal ne contient ni contenu de page, ni jeton, ni adresse complète.', events }, null, 2) }; }

function sanitize(value) { return String(value || 'Événement système.').replace(/https?:\/\/[^\s]+/gi, '[url masquée]').replace(/(token|bearer|apikey|secret)[^\s]*/gi, '[donnée sensible masquée]').slice(0, 240); }
function validDate(value) { return Number.isFinite(new Date(value).getTime()); }
