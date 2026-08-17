const HISTORY_KEY = 'aitools.search.history';

export const SEARCH_PRESETS = [
  { label: 'Site', query: 'site:', hint: 'Limiter à un site' },
  { label: 'Titre', query: 'intitle:', hint: 'Chercher dans le titre' },
  { label: 'PDF', query: 'filetype:pdf ', hint: 'Documents PDF' },
  { label: 'Après', query: 'after:2025-01-01 ', hint: 'Résultats récents' },
  { label: 'Images HD', query: 'imagesize:large ', hint: 'Grandes images' },
  { label: 'Exact', query: '""', hint: 'Expression exacte' },
  { label: 'Exclure', query: '-', hint: 'Retirer un terme' },
  { label: 'URL', query: 'inurl:', hint: 'Chercher dans l’URL' }
];

export const SEARCH_CATEGORIES = {
  web: '',
  news: 'tbm=nws',
  images: 'tbm=isch',
  videos: 'tbm=vid',
  maps: 'tbm=lcl'
};

export function buildGoogleUrl(query, category = 'web') {
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  if (SEARCH_CATEGORIES[category]) url.search = `${url.search}&${SEARCH_CATEGORIES[category]}`;
  return url.toString();
}

export async function getSearchHistory() {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
}

export async function clearSearchHistory() { await chrome.storage.local.remove(HISTORY_KEY); }

export async function saveSearch(query) {
  const normalized = String(query || '').trim();
  if (!normalized) return [];
  const existing = await getSearchHistory();
  const history = [normalized, ...existing.filter((item) => item !== normalized)].slice(0, 12);
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  return history;
}
