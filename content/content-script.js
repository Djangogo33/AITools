const MESSAGE_TYPES = {
  getPageText: 'page/get-text',
  captureContext: 'page/capture-context',
  anonymizePage: 'page/anonymize',
  summarizePage: 'page/summarize',
  getReadingTime: 'page/reading-time',
  toggleFocus: 'page/toggle-focus',
  setFocus: 'page/set-focus',
  highlightSelection: 'page/highlight-selection',
  printPage: 'page/print',
  togglePageDark: 'page/toggle-dark',
  dismissCookies: 'page/dismiss-cookies',
  blockSponsored: 'page/block-sponsored',
  youtubeTheater: 'page/youtube-theater',
  youtubeSpeed: 'page/youtube-speed',
  getMediaInfo: 'page/get-media-info'
};

const FOCUS_STYLE_ID = 'aitools-focus-style';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handlers = {
    [MESSAGE_TYPES.getPageText]: () => ({ text: extractReadableText() }),
    [MESSAGE_TYPES.captureContext]: () => captureContext(),
    [MESSAGE_TYPES.anonymizePage]: () => ({ count: anonymizeVisibleText() }),
    [MESSAGE_TYPES.summarizePage]: () => ({ summary: summarizeLocally(extractReadableText()) }),
    [MESSAGE_TYPES.getReadingTime]: () => readingTime(),
    [MESSAGE_TYPES.toggleFocus]: () => ({ enabled: toggleFocusMode() }),
    [MESSAGE_TYPES.setFocus]: () => ({ enabled: setFocusMode(Boolean(message.enabled)) }),
    [MESSAGE_TYPES.highlightSelection]: () => ({ highlighted: highlightSelection() }),
    [MESSAGE_TYPES.printPage]: () => { window.print(); return { opened: true }; },
    [MESSAGE_TYPES.togglePageDark]: () => ({ enabled: togglePageDarkMode() }),
    [MESSAGE_TYPES.dismissCookies]: () => ({ removed: dismissCookieBanners() }),
    [MESSAGE_TYPES.blockSponsored]: () => ({ removed: blockSponsoredResults() }),
    [MESSAGE_TYPES.youtubeTheater]: () => youtubeTheaterMode(),
    [MESSAGE_TYPES.youtubeSpeed]: () => youtubePlaybackSpeed(),
    [MESSAGE_TYPES.getMediaInfo]: () => getMediaInfo()
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  try { sendResponse({ ok: true, ...handler() }); } catch (error) { sendResponse({ ok: false, error: error.message || 'Action impossible.' }); }
  return false;
});

function captureContext() {
  const selected = String(window.getSelection?.()?.toString() || '').replace(/\s+/g, ' ').trim();
  const text = selected || extractReadableText().slice(0, 1_200);
  return { title: document.title || location.hostname, url: location.href, text, selection: Boolean(selected) };
}

function extractReadableText() {
  const readRoot = (root) => { const blocks = [...root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre')].map((element) => (element.innerText || '').replace(/\s+/g, ' ').trim()).filter((value) => value.length >= 2); return blocks.length > 1 ? blocks.join('\n') : (root.innerText || ''); };
  const roots = [...document.querySelectorAll('article, main, [role="main"]')];
  let text = roots.map(readRoot).sort((a, b) => b.length - a.length)[0] || '';
  if (!text && document.body) {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,nav,header,footer,aside,[role="navigation"],[aria-label*="cookie" i],[class*="cookie" i],[id*="cookie" i]').forEach((element) => element.remove());
    text = readRoot(clone);
  }
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 18_000);
}

function summarizeLocally(text) {
  const source = String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
  if (!source) return 'Aucun contenu lisible n’a été trouvé sur cette page.';
  const candidates = source.split(/\n+|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9À-ÿ])/u).map((item) => item.replace(/^[-*•]\s*/, '').trim()).filter((item) => item.length >= 24);
  if (!candidates.length) return `• ${source.replace(/\n+/g, ' — ').slice(0, 480)}`;
  const words = candidates.flatMap((sentence) => sentence.toLowerCase().match(/[\p{L}\d]{3,}/gu) || []); const frequency = words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
  const count = candidates.length <= 3 ? candidates.length : source.length < 900 ? 3 : 5;
  return candidates.map((sentence, index) => ({ sentence, index, score: (index === 0 ? 1.5 : 0) + Math.min(1.2, sentence.length / 500) + [...new Set(sentence.toLowerCase().match(/[\p{L}\d]{3,}/gu) || [])].reduce((sum, word) => sum + Math.min(0.4, (frequency.get(word) || 0) * 0.08), 0) })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, count).sort((a, b) => a.index - b.index).map(({ sentence }) => `• ${sentence}`).join('\n');
}

function readingTime() {
  const words = extractReadableText().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.ceil(words / 220)) };
}

function setFocusMode(enabled) {
  const existing = document.getElementById(FOCUS_STYLE_ID);
  if (enabled && !existing) return toggleFocusMode();
  if (!enabled && existing) { existing.remove(); document.documentElement.classList.remove('aitools-focus-mode'); return false; }
  return Boolean(existing);
}

function toggleFocusMode() {
  const existing = document.getElementById(FOCUS_STYLE_ID);
  if (existing) { existing.remove(); document.documentElement.classList.remove('aitools-focus-mode'); return false; }
  const style = document.createElement('style');
  style.id = FOCUS_STYLE_ID;
  style.textContent = `
    html.aitools-focus-mode header, html.aitools-focus-mode nav, html.aitools-focus-mode aside,
    html.aitools-focus-mode [role="navigation"], html.aitools-focus-mode .advertisement,
    html.aitools-focus-mode [id*="cookie" i], html.aitools-focus-mode [class*="cookie" i] { display: none !important; }
    html.aitools-focus-mode body { background: #f8fafc !important; }
    html.aitools-focus-mode article, html.aitools-focus-mode main, html.aitools-focus-mode [role="main"] { max-width: 780px !important; margin: 48px auto !important; font-size: 1.08em !important; line-height: 1.8 !important; }
  `;
  document.head.append(style); document.documentElement.classList.add('aitools-focus-mode'); return true;
}

function highlightSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  const mark = document.createElement('mark'); mark.className = 'aitools-highlight'; mark.style.cssText = 'background:#fde68a;color:inherit;padding:0 .08em;border-radius:.12em;';
  try { range.surroundContents(mark); selection.removeAllRanges(); return true; } catch { return false; }
}

function youtubeTheaterMode() {
  if (!/youtube\.com/i.test(location.hostname)) throw new Error('Cette action nécessite une page YouTube.');
  const button = document.querySelector('.ytp-size-button');
  if (!button) throw new Error('Lecteur YouTube introuvable.');
  button.click(); return { message: 'Mode cinéma activé ou désactivé.' };
}

function youtubePlaybackSpeed() {
  if (!/youtube\.com/i.test(location.hostname)) throw new Error('Cette action nécessite une page YouTube.');
  const video = document.querySelector('video');
  if (!video) throw new Error('Vidéo YouTube introuvable.');
  const next = video.playbackRate >= 1.5 ? 1 : 1.5; video.playbackRate = next;
  return { message: `Vitesse réglée sur ${String(next).replace('.', ',')}×.` };
}

function togglePageDarkMode() {
  const id = 'aitools-page-dark-style'; const existing = document.getElementById(id);
  if (existing) { existing.remove(); return false; }
  const style = document.createElement('style'); style.id = id;
  style.textContent = 'html{filter:invert(1) hue-rotate(180deg)!important;background:#111!important} img,video,picture,canvas,iframe{filter:invert(1) hue-rotate(180deg)!important}';
  document.head.append(style); return true;
}

function dismissCookieBanners() {
  const candidates = [...document.querySelectorAll('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[aria-label*="cookie" i]')];
  let removed = 0;
  candidates.forEach((element) => {
    const text = (element.innerText || '').toLowerCase();
    if (text.includes('cookie') || text.includes('consent') || text.includes('confidentialité')) { element.style.setProperty('display', 'none', 'important'); removed += 1; }
  });
  return removed;
}

function blockSponsoredResults() {
  if (!/google\./i.test(location.hostname)) return 0;
  const items = [...document.querySelectorAll('div')]; let removed = 0;
  items.forEach((element) => {
    if (element.children.length > 8 || element.offsetHeight < 20) return;
    const text = (element.innerText || '').trim().toLowerCase();
    if ((text === 'sponsorisé' || text === 'sponsored' || text.startsWith('sponsorisé\n')) && !element.dataset.aitoolsBlocked) { element.dataset.aitoolsBlocked = 'true'; element.closest('[data-text-ad], [data-ved], div.g')?.style.setProperty('display', 'none', 'important'); removed += 1; }
  });
  return removed;
}

function getMediaInfo() {
  const normalize = (value) => { try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null; } catch { return null; } };
  const collect = (selector, type, source) => [...document.querySelectorAll(selector)].map((element) => ({ type, url: normalize(source(element)), alt: String(element.getAttribute('alt') || element.getAttribute('aria-label') || '').trim().slice(0, 180) || null })).filter((item) => item.url);
  const images = collect('img', 'image', (element) => element.currentSrc || element.src);
  const videos = collect('video', 'video', (element) => element.currentSrc || element.src || element.querySelector('source')?.src);
  const audios = collect('audio', 'audio', (element) => element.currentSrc || element.src || element.querySelector('source')?.src);
  const unique = new Map();
  [...images, ...videos, ...audios].forEach((item) => { if (!unique.has(item.url)) unique.set(item.url, item); });
  return { items: [...unique.values()].slice(0, 80), counts: { images: images.length, videos: videos.length, audios: audios.length } };
}

function anonymizeVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  const patterns = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email masqué]'],
    [/(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b/g, '[téléphone masqué]'],
    [/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[IP masquée]']
  ];
  for (const node of nodes) {
    if (!node.parentElement || ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(node.parentElement.tagName)) continue;
    let value = node.nodeValue;
    for (const [pattern, replacement] of patterns) value = value.replace(pattern, () => { count += 1; return replacement; });
    node.nodeValue = value;
  }
  return count;
}
