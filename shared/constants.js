export const STORAGE_KEYS = {
  settings: 'aitools.settings',
  notes: 'aitools.notes',
  pomodoro: 'aitools.pomodoro'
};

export const NEW_TAB_DESTINATIONS = ['dashboard', 'native', 'search'];
export const NEW_TAB_SEARCH_ENGINES = {
  google: { label: 'Google', url: 'https://www.google.com/' },
  qwant: { label: 'Qwant', url: 'https://www.qwant.com/' },
  brave: { label: 'Brave Search', url: 'https://search.brave.com/' },
  bing: { label: 'Bing', url: 'https://www.bing.com/' },
  duckduckgo: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
  ecosia: { label: 'Ecosia', url: 'https://www.ecosia.org/' }
};

export const FEATURE_CATALOG = [
  { id: 'web.summary', group: 'Page web', label: 'Résumé de page', description: 'Synthèse locale et repli extractif.' },
  { id: 'web.reading', group: 'Page web', label: 'Temps et mode lecture', description: 'Estimation de lecture et réduction des distractions.' },
  { id: 'web.appearance', group: 'Page web', label: 'Filtre sombre de page', description: 'Applique un filtre sombre réversible.' },
  { id: 'web.cleaning', group: 'Page web', label: 'Nettoyage de page', description: 'Cookies et résultats sponsorisés.' },
  { id: 'web.privacy', group: 'Page web', label: 'Anonymisation et surlignage', description: 'Masquage local et mise en évidence de sélection.' },
  { id: 'web.print', group: 'Page web', label: 'Impression / PDF', description: 'Ouvre la boîte d’impression de Chrome.' },
  { id: 'text.clean', group: 'Texte & données', label: 'Nettoyage de texte', description: 'Normalise espaces et lignes.' },
  { id: 'text.case', group: 'Texte & données', label: 'Transformation de casse', description: 'Majuscules, minuscules et casse titre.' },
  { id: 'text.json', group: 'Texte & données', label: 'Formatage JSON', description: 'Valide et met en forme du JSON.' },
  { id: 'text.url', group: 'Texte & données', label: 'Encodage URL', description: 'Encode et décode les URLs.' },
  { id: 'text.base64', group: 'Texte & données', label: 'Base64', description: 'Encode et décode du texte Base64.' },
  { id: 'text.clipboard', group: 'Texte & données', label: 'Copie et réutilisation', description: 'Copie ou réinjecte les résultats.' },
  { id: 'browser.finder', group: 'Onglets & navigateur', label: 'Recherche d’onglets', description: 'Filtre les onglets de la fenêtre.' },
  { id: 'browser.duplicates', group: 'Onglets & navigateur', label: 'Fermeture des doublons', description: 'Ferme les URLs dupliquées.' },
  { id: 'browser.grouping', group: 'Onglets & navigateur', label: 'Groupement par site', description: 'Crée des groupes d’onglets par domaine.' },
  { id: 'browser.links', group: 'Onglets & navigateur', label: 'Copie des liens', description: 'Copie les titres et URLs de la fenêtre.' },
  { id: 'media.inspect', group: 'Médias', label: 'Inventaire multimédia', description: 'Liste les images, vidéos et audios de page.' },
  { id: 'media.palette', group: 'Médias', label: 'Palette média', description: 'Génère une palette locale depuis le titre.' },
  { id: 'media.youtube', group: 'Médias', label: 'Contrôles YouTube', description: 'Mode cinéma et vitesse de lecture.' },
  { id: 'ai.page', group: 'IA', label: 'Utiliser la page', description: 'Extrait le texte de la page pour l’IA locale.' },
  { id: 'ai.summary', group: 'IA', label: 'Résumé IA', description: 'Résumé via Chrome ou repli local.' },
  { id: 'ai.translation', group: 'IA', label: 'Traduction IA', description: 'Traduction locale lorsque disponible.' },
  { id: 'ai.analysis', group: 'IA', label: 'Analyse stylistique', description: 'Analyse probabiliste du style de texte.' },
  { id: 'ai.palette', group: 'IA', label: 'Palette IA', description: 'Palette déterministe depuis un texte.' },
  { id: 'ai.tabs', group: 'IA', label: 'Synthèse des onglets', description: 'Synthèse locale des onglets courants.' },
  { id: 'ai.clipboard', group: 'IA', label: 'Copie des résultats IA', description: 'Copie le résultat d’analyse.' },
  { id: 'productivity.notes', group: 'Productivité', label: 'Notes', description: 'Création et gestion de notes locales.' },
  { id: 'productivity.reading', group: 'Productivité', label: 'Liste de lecture', description: 'Ajout et suivi des pages à lire.' },
  { id: 'productivity.tasks', group: 'Productivité', label: 'Tâches et rappels', description: 'Tâches, récurrence, échéances et rappels.' },
  { id: 'productivity.inbox', group: 'Productivité', label: 'Boîte à traiter', description: 'Captures de page à transformer.' },
  { id: 'productivity.workspaces', group: 'Productivité', label: 'Espaces de travail', description: 'Capture et restauration de fenêtres.' },
  { id: 'productivity.pomodoro', group: 'Productivité', label: 'Pomodoro', description: 'Minuteur et sessions de concentration.' },
  { id: 'productivity.focus', group: 'Productivité', label: 'Concentration privée', description: 'Statistiques et mode Ne pas déranger par site.' },
  { id: 'browser.rules', group: 'Onglets & navigateur', label: 'Règles d’organisation', description: 'Règles automatiques de groupement d’onglets.' },
  { id: 'data.backup', group: 'Données locales', label: 'Import, export et réinitialisation', description: 'Sauvegarde et restauration des données locales.' },
  { id: 'diagnostics', group: 'Données locales', label: 'Diagnostic local', description: 'Export d’un journal sans données sensibles.' },
  { id: 'search.web', group: 'Recherche', label: 'Recherche web', description: 'Recherche externe et catégories Google.' },
  { id: 'search.local', group: 'Recherche', label: 'Recherche AITools', description: 'Recherche dans les données locales.' },
  { id: 'search.history', group: 'Recherche', label: 'Historique et opérateurs', description: 'Historique local et requêtes avancées.' },
  { id: 'newtab.dashboard', group: 'Nouvel onglet', label: 'Tableau de bord', description: 'Affichage du tableau de bord AITools.' },
  { id: 'newtab.search', group: 'Nouvel onglet', label: 'Recherche de nouvel onglet', description: 'Redirection vers un moteur choisi.' },
  { id: 'newtab.shortcuts', group: 'Nouvel onglet', label: 'Raccourcis', description: 'Sites favoris du nouvel onglet.' },
  { id: 'newtab.productivity', group: 'Nouvel onglet', label: 'Widgets productivité', description: 'Notes, tâches, lecture et Pomodoro.' },
  { id: 'service.auth', group: 'Services optionnels', label: 'Connexion Google', description: 'Authentification Supabase via Google.' },
  { id: 'service.sync', group: 'Services optionnels', label: 'Synchronisation Supabase', description: 'Synchronisation volontaire des données.' },
  { id: 'service.billing', group: 'Services optionnels', label: 'Abonnements Stripe', description: 'Checkout et portail client, si déployés.' }
];
export const DEFAULT_FEATURE_FLAGS = Object.freeze(Object.fromEntries(FEATURE_CATALOG.map(({ id }) => [id, true])));

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  compactMode: false,
  pomodoroMinutes: 25,
  newTabDestination: 'dashboard',
  newTabSearchEngine: 'google',
  featureFlags: DEFAULT_FEATURE_FLAGS,
  quickLinks: [
    { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com', tone: 'violet' },
    { id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai', tone: 'blue' },
    { id: 'whatsapp', label: 'WhatsApp', url: 'https://web.whatsapp.com', tone: 'green' },
    { id: 'github', label: 'GitHub', url: 'https://github.com', tone: 'slate' }
  ]
};

export const MESSAGE_TYPES = {
  getPageText: 'page/get-text',
  captureContext: 'page/capture-context',
  anonymizePage: 'page/anonymize',
  summarizePage: 'page/summarize',
  getReadingTime: 'page/reading-time',
  toggleFocus: 'page/toggle-focus',
  highlightSelection: 'page/highlight-selection',
  printPage: 'page/print',
  togglePageDark: 'page/toggle-dark',
  dismissCookies: 'page/dismiss-cookies',
  blockSponsored: 'page/block-sponsored',
  getMediaInfo: 'page/get-media-info',
  pomodoroTick: 'pomodoro/tick',
  pomodoroState: 'pomodoro/state'
};

export function getFeatureFlags(settings) {
  const candidate = settings?.featureFlags && typeof settings.featureFlags === 'object' ? settings.featureFlags : {};
  return Object.fromEntries(FEATURE_CATALOG.map(({ id }) => [id, candidate[id] !== false]));
}
export function isFeatureEnabled(settings, featureId) { return getFeatureFlags(settings)[featureId] !== false; }
export function getFeatureGroups() { return FEATURE_CATALOG.reduce((groups, feature) => { (groups[feature.group] ||= []).push(feature); return groups; }, {}); }

export function getNewTabDestination(settings) { return NEW_TAB_DESTINATIONS.includes(settings?.newTabDestination) ? settings.newTabDestination : DEFAULT_SETTINGS.newTabDestination; }
export function getNewTabSearchEngine(settings) { return Object.hasOwn(NEW_TAB_SEARCH_ENGINES, settings?.newTabSearchEngine) ? settings.newTabSearchEngine : DEFAULT_SETTINGS.newTabSearchEngine; }
export function getNewTabSearchUrl(settings) { return NEW_TAB_SEARCH_ENGINES[getNewTabSearchEngine(settings)].url; }

export function getPomodoroMinutes(settings) {
  const value = Number(settings?.pomodoroMinutes);
  return Number.isFinite(value) ? Math.min(120, Math.max(5, Math.round(value))) : DEFAULT_SETTINGS.pomodoroMinutes;
}

export function getQuickLinks(settings) {
  const candidate = Array.isArray(settings?.quickLinks) ? settings.quickLinks : DEFAULT_SETTINGS.quickLinks;
  return candidate.flatMap((link, index) => {
    try {
      const url = new URL(link?.url);
      if (!['https:', 'http:'].includes(url.protocol)) return [];
      const label = String(link?.label || url.hostname).trim().slice(0, 24);
      if (!label) return [];
      return [{ id: String(link?.id || `link-${index}`), label, url: url.toString(), tone: ['violet', 'blue', 'green', 'slate'].includes(link?.tone) ? link.tone : 'slate' }];
    } catch { return []; }
  });
}

export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(patch) {
  const normalizedPatch = { ...patch };
  if (Object.hasOwn(normalizedPatch, 'pomodoroMinutes')) normalizedPatch.pomodoroMinutes = getPomodoroMinutes(normalizedPatch);
  if (Object.hasOwn(normalizedPatch, 'newTabDestination')) normalizedPatch.newTabDestination = getNewTabDestination(normalizedPatch);
  if (Object.hasOwn(normalizedPatch, 'newTabSearchEngine')) normalizedPatch.newTabSearchEngine = getNewTabSearchEngine(normalizedPatch);
  if (Object.hasOwn(normalizedPatch, 'featureFlags')) normalizedPatch.featureFlags = getFeatureFlags({ featureFlags: normalizedPatch.featureFlags });
  const settings = { ...(await getSettings()), ...normalizedPatch, updatedAt: new Date().toISOString() };
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return settings;
}

export async function getNotes() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.notes);
  return Array.isArray(result[STORAGE_KEYS.notes]) ? result[STORAGE_KEYS.notes] : [];
}

export async function saveNotes(notes) {
  await chrome.storage.local.set({ [STORAGE_KEYS.notes]: notes });
  return notes;
}
