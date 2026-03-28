// AITools Content Script v4.0 - Optimized
// All features: Reading time, Dark mode, Notes, Google enhancements, Sponsor blocker, AI detector, Summarizer

const DEBUG = false;

let extensionEnabled = true;
let darkModeEnabled = false;
let readingTimeBadgeShown = false;
let highlighterEnabled = true;

let extensionSettings = {
  aiDetectorEnabled: true,
  focusModeEnabled: false,
  summarizerEnabled: true,
  autoTranslatorEnabled: true,
  translatorTargetLang: 'fr',
  summarizerLang: 'fr',
  aiDetectorSensitivity: 60,
  summarizerLength: 35,
  cookieBlockerEnabled: true,
  readingTimeEnabled: true,
  quickStatsEnabled: true,
  performanceModeEnabled: false
};

let elementVisibility = {
  aiBadge: true,
  summarizerBtn: true
};

let buttonVisibility = {
  googleButtons: true,
  summarizerButton: true,
  focusModeBadge: true,
  aiDetectorBadge: true,
  translationButtons: true,
  quickStatsWidget: true,
  readingTimeBadge: true,
  notesHighlighter: true
};

// Load all settings from storage
chrome.storage.local.get(null, (result) => {
  if (result.aiDetectorSensitivity) extensionSettings.aiDetectorSensitivity = parseInt(result.aiDetectorSensitivity);
  if (result.summarizerLength) extensionSettings.summarizerLength = parseInt(result.summarizerLength);
  if (result.summarizerLang) extensionSettings.summarizerLang = result.summarizerLang;
  if (result.autoTranslatorEnabled !== undefined) extensionSettings.autoTranslatorEnabled = result.autoTranslatorEnabled;
  if (result.translatorTargetLang) extensionSettings.translatorTargetLang = result.translatorTargetLang;
  if (result.cookieBlockerEnabled !== undefined) extensionSettings.cookieBlockerEnabled = result.cookieBlockerEnabled;
  if (result.readingTimeEnabled !== undefined) extensionSettings.readingTimeEnabled = result.readingTimeEnabled;
  if (result.quickStatsEnabled !== undefined) extensionSettings.quickStatsEnabled = result.quickStatsEnabled;
  if (result.performanceModeEnabled !== undefined) extensionSettings.performanceModeEnabled = result.performanceModeEnabled;
  if (result['aitools-visibility']) {
    elementVisibility = { ...elementVisibility, ...result['aitools-visibility'] };
  }
  if (result.buttonVisibility) {
    buttonVisibility = { ...buttonVisibility, ...result.buttonVisibility };
  }
  highlighterEnabled = buttonVisibility.notesHighlighter !== false;
});

// ============================================================================
// DRAGGABLE UTILITY
// ============================================================================
function makeDraggable(element, storageKey) {
  if (DEBUG) console.log('[AITools] makeDraggable:', storageKey);

  let isDragging = false;
  let startX = 0, startY = 0;
  let offsetX = 0, offsetY = 0;
  let dragDistance = 0;
  const dragThreshold = 5;

  chrome.storage.local.get([storageKey], (result) => {
    if (result[storageKey]) {
      const pos = result[storageKey];
      element.style.position = 'fixed';
      element.style.top = pos.top + 'px';
      element.style.left = pos.left + 'px';
      element.style.right = 'auto';
    }
  });

  element.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, textarea, a')) return;
    if (e.target.closest('.aitools-close-btn')) return;

    isDragging = true;
    dragDistance = 0;
    startX = e.clientX;
    startY = e.clientY;

    element.style.position = 'fixed';
    element.style.zIndex = '999999';

    const rect = element.getBoundingClientRect();
    offsetX = rect.left - e.clientX;
    offsetY = rect.top - e.clientY;
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragDistance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
    if (dragDistance < dragThreshold) return;
    element.style.left = (e.clientX + offsetX) + 'px';
    element.style.top = (e.clientY + offsetY) + 'px';
    element.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    element.style.cursor = 'grab';
    element.style.zIndex = '10000';
    if (dragDistance >= dragThreshold) {
      const rect = element.getBoundingClientRect();
      chrome.storage.local.set({ [storageKey]: { top: rect.top, left: rect.left } });
    }
  });

  element.style.cursor = 'grab';
}

// ============================================================================
// DARK MODE
// ============================================================================
function enableDarkMode() {
  if (document.getElementById('aitools-dark-css')) return;
  const style = document.createElement('style');
  style.id = 'aitools-dark-css';
  style.textContent = `
    * { background-color: #1e1e1e !important; color: #e4e4e4 !important; border-color: #444 !important; }
    a { color: #64b5f6 !important; }
    img, video { opacity: 0.8; }
    input, textarea { background: #333 !important; color: #fff !important; }
  `;
  document.head.appendChild(style);
  darkModeEnabled = true;
}

function disableDarkMode() {
  const style = document.getElementById('aitools-dark-css');
  if (style) style.remove();
  darkModeEnabled = false;
}

// ============================================================================
// NOTES HIGHLIGHTER
// ============================================================================
function setupHighlighter() {
  if (!highlighterEnabled) return;

  let menu = null;

  document.addEventListener('mouseup', () => {
    if (!highlighterEnabled) return;
    const selected = window.getSelection().toString().trim();

    // Remove existing menu
    if (menu && menu.parentNode) {
      menu.remove();
      menu = null;
    }

    if (!selected) return;

    menu = document.createElement('div');
    menu.id = 'aitools-highlight-menu';
    menu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 12px;
    `;

    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    menu.style.left = Math.min(rect.left, window.innerWidth - 160) + 'px';
    menu.style.top = (rect.bottom + 8) + 'px';

    const noteBtn = document.createElement('button');
    noteBtn.textContent = '📝 Ajouter note';
    noteBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:12px;padding:4px 8px;border-radius:4px;white-space:nowrap;';
    noteBtn.addEventListener('mouseover', () => noteBtn.style.background = '#f0f0f0');
    noteBtn.addEventListener('mouseout', () => noteBtn.style.background = 'none');
    noteBtn.addEventListener('click', () => {
      aiToolsAddNote(selected);
      if (menu) { menu.remove(); menu = null; }
    });

    menu.appendChild(noteBtn);
    document.body.appendChild(menu);
  });

  // Disappear immediately when selection is cleared
  document.addEventListener('selectionchange', () => {
    const selected = window.getSelection().toString().trim();
    if (!selected && menu && menu.parentNode) {
      menu.remove();
      menu = null;
    }
  });
}

window.aiToolsAddNote = function(text) {
  chrome.runtime.sendMessage({
    action: 'addNote',
    data: { text, url: window.location.href, title: document.title, timestamp: new Date().toISOString() }
  });
};

// ============================================================================
// GOOGLE SEARCH ENHANCEMENTS
// ============================================================================
function setupGoogleEnhancements() {
  if (!window.location.hostname.includes('google.')) return;

  // Only show buttons if there's an active search query
  function hasActiveSearch() {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      return q && q.trim().length > 0;
    } catch {
      return false;
    }
  }

  if (!hasActiveSearch()) {
    if (DEBUG) console.log('[AITools] No search query, skipping Google buttons');
    return;
  }

  // Check if globally enabled (default true)
  if (buttonVisibility.googleButtons === false) {
    if (DEBUG) console.log('[AITools] Google buttons disabled');
    return;
  }

  function getGoogleSearchInput() {
    let input = document.querySelector('input[name="q"]');
    if (input && input.offsetParent !== null) return input;

    const searchForm = document.querySelector('form[action*="/search"]');
    if (searchForm) {
      input = searchForm.querySelector('input[type="text"]');
      if (input) return input;
    }

    const inputs = document.querySelectorAll('input[type="text"]');
    for (let inp of inputs) {
      if (inp.offsetParent !== null && inp.getBoundingClientRect().top < 200) return inp;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q') || '';
      if (query) return { value: query, fromURL: true };
    } catch {}

    return null;
  }

  let isInjecting = false;

  const injectGoogleButtons = () => {
    if (isInjecting) return;
    if (!hasActiveSearch()) return;

    const searchInput = getGoogleSearchInput();
    if (!searchInput) {
      setTimeout(injectGoogleButtons, 1000);
      return;
    }

    if (document.getElementById('aitools-google-buttons')) return;

    isInjecting = true;

    const container = document.createElement('div');
    container.id = 'aitools-google-buttons';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      background: transparent;
      z-index: 10000;
      max-width: 400px;
    `;

    if (!document.getElementById('aitools-google-styles')) {
      const style = document.createElement('style');
      style.id = 'aitools-google-styles';
      style.textContent = `
        .aitools-gb {
          display: inline-flex; align-items: center; padding: 8px 12px;
          background: transparent; color: #5f6368; border: none; border-radius: 4px;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
          white-space: nowrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          pointer-events: auto; user-select: none;
        }
        .aitools-gb:hover { color: #202124; background: rgba(0,0,0,0.05); border-radius: 4px; }
        .aitools-gb:active { background: rgba(102,126,234,0.1); }
        #aitools-google-buttons { cursor: grab !important; }
        #aitools-google-buttons:active { cursor: grabbing !important; }
      `;
      document.head.appendChild(style);
    }

    chrome.storage.local.get(['googleButtonsVisibility', 'googleButtonsConfig'], (result) => {
      const visibility = result.googleButtonsVisibility || { lucky: true, filters: true, maps: true, chatgpt: true };
      const config = result.googleButtonsConfig || {};

      const buttonDefs = [
        { key: 'lucky', label: '🍀 Chance', action: 'lucky' },
        { key: 'filters', label: '🔍 Filtres', action: 'filters' },
        { key: 'maps', label: '🗺️ Maps', action: 'maps' },
        { key: 'chatgpt', label: '🤖 ChatGPT', action: 'chatgpt' }
      ];

      // Check if music search → add YouTube Music button
      const currentQuery = getGoogleSearchInput()?.value?.trim() || new URLSearchParams(window.location.search).get('q') || '';
      const musicKeywords = ['music', 'musique', 'chanson', 'song', 'album', 'artist', 'artiste', 'lyrics', 'paroles', 'titre', 'track', 'remix', 'feat', 'clip', 'discographie'];
      const isMusicSearch = musicKeywords.some(kw => currentQuery.toLowerCase().includes(kw));
      if (isMusicSearch) {
        buttonDefs.push({ key: 'ytmusic', label: '🎵 YT Music', action: 'ytmusic' });
      }

      buttonDefs.forEach((def) => {
        // ytmusic has no visibility toggle, always shown when music search
        if (def.key !== 'ytmusic' && visibility[def.key] === false) return;

        const customConfig = config[def.key] || {};
        const label = customConfig.label || def.label;
        const action = customConfig.action || def.action;
        const color = customConfig.color || '#5f6368';

        const btn = document.createElement('button');
        btn.className = 'aitools-gb';
        btn.innerHTML = label;
        btn.type = 'button';
        btn.id = `aitools-gb-${def.key}`;
        btn.style.color = color;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const input = getGoogleSearchInput();
          const query = input?.value?.trim() || new URLSearchParams(window.location.search).get('q') || '';

          if (!query) {
            alert('⚠️ Entrez une recherche');
            return;
          }

          switch (action) {
            case 'lucky':
              window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
              break;
            case 'maps':
              window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
              break;
            case 'chatgpt':
              window.open(`https://chatgpt.com/?q=${encodeURIComponent(query)}`, '_blank');
              break;
            case 'ytmusic':
              window.open(`https://music.youtube.com/search?q=${encodeURIComponent(query)}`, '_blank');
              break;
            case 'filters':
              alert('Utilisez les filtres avancés de Google en cliquant sur "Outils" dans la barre de recherche');
              break;
          }
        });

        container.appendChild(btn);
      });

      if (container.children.length > 0) {
        document.body.appendChild(container);
        makeDraggable(container, 'aitools-google-buttons-pos');
        container.style.display = 'flex';
      }
      isInjecting = false;
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(injectGoogleButtons, 500));
  } else {
    setTimeout(injectGoogleButtons, 500);
  }

  // Watch for SPA navigation
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const container = document.getElementById('aitools-google-buttons');
      if (container) container.remove();
      isInjecting = false;
      if (hasActiveSearch()) setTimeout(injectGoogleButtons, 300);
    } else if (!document.getElementById('aitools-google-buttons') && hasActiveSearch()) {
      setTimeout(injectGoogleButtons, 100);
    }
  }).observe(document.body, { childList: true, subtree: false });
}

// ============================================================================
// BLOCK SPONSORED RESULTS
// ============================================================================
function blockSponsoredResults() {
  if (!window.location.hostname.includes('google.')) return;
  document.querySelectorAll('[data-sokoban-container]').forEach(el => {
    if (el.textContent.includes('Annonce') || el.textContent.includes('Ad')) el.remove();
  });
  document.querySelectorAll('div[data-ad-layout="ad"]').forEach(el => el.remove());
}

// ============================================================================
// COOKIE BLOCKER
// ============================================================================
let cookieObserver = null;
let cookieObserverPaused = false;

function initCookieBlocker() {
  if (!extensionSettings.cookieBlockerEnabled) return;

  setTimeout(() => {
    closeCookiePopups();
  }, 1500);

  let debounceTimer = null;
  cookieObserver = new MutationObserver(() => {
    if (cookieObserverPaused) return;
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      closeCookiePopups();
      debounceTimer = null;
    }, 300);
  });

  cookieObserver.observe(document.body, {
    childList: true,
    subtree: false
  });
}

const COOKIE_KEYWORDS = ['cookie', 'cookies', 'gdpr', 'consentement', 'consent', 'privacy', 'vie privée', 'données personnelles', 'personal data', 'accepter', 'accept', 'politique de confidentialité'];

function elementHasCookieKeyword(element) {
  const text = element.innerText?.toLowerCase() || '';
  return COOKIE_KEYWORDS.some(kw => text.includes(kw));
}

function closeCookiePopups() {
  const popupSelectors = [
    '[id*="cookie"], [class*="cookie"]',
    '[id*="consent"], [class*="consent"]',
    '[id*="gdpr"], [class*="gdpr"]',
    '[role="dialog"][aria-label*="cookie" i]',
    '[role="dialog"][aria-label*="consent" i]',
    '[id*="onetrust"], [class*="onetrust"]',
    '[id*="cookiepro"], [class*="cookiepro"]',
    '[id*="borlabs"], [class*="borlabs"]',
    '[id*="termly"], [class*="termly"]'
  ];

  document.querySelectorAll(popupSelectors.join(', ')).forEach(popup => {
    if (!isVisible(popup)) return;
    // Must be tall enough and have cookie keywords
    if (popup.offsetHeight < 50) return;
    const text = popup.innerText || '';
    if (text.length < 20) return;
    if (!elementHasCookieKeyword(popup)) return;

    const clicked = tryClickAcceptButton(popup);
    if (clicked) {
      // Pause observer for 5 seconds to avoid loops
      cookieObserverPaused = true;
      setTimeout(() => { cookieObserverPaused = false; }, 5000);
    }
  });
}

function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.offsetHeight > 0;
}

function tryClickAcceptButton(popup) {
  const acceptPatterns = [
    'accept all', 'accepter tout', 'tout accepter', 'j\'accepte', 'agree',
    'allow all', 'autoriser tout', 'confirm', 'continue', 'ok', 'accept',
    'aceptar', 'alle akzeptieren', 'accetta', 'concordo', 'oui', 'yes'
  ];

  const buttons = popup.querySelectorAll('button, a[role="button"], [role="button"]');
  for (const btn of buttons) {
    const btnText = btn.textContent.toLowerCase().trim();
    const btnClass = btn.className.toLowerCase();
    const btnId = btn.id.toLowerCase();

    for (const pattern of acceptPatterns) {
      if (btnText.includes(pattern)) {
        btn.click();
        return true;
      }
    }

    if (btnClass.includes('accept') || btnClass.includes('agree') || btnId.includes('accept') || btnId.includes('agree')) {
      btn.click();
      return true;
    }
  }

  // Hide as fallback only if very clearly a cookie popup
  popup.style.display = 'none';
  return false;
}

// ============================================================================
// AI DETECTOR
// ============================================================================
function initAIDetector() {
  if (buttonVisibility.aiDetectorBadge === false) return;
  if (!extensionSettings.aiDetectorEnabled) return;

  const hostname = window.location.hostname;
  if (hostname.includes('google.') || hostname.includes('facebook.') || hostname.includes('twitter.') ||
    hostname.includes('instagram.') || hostname.includes('youtube.') || hostname.includes('reddit.')) return;

  setTimeout(() => {
    const text = document.body.innerText;
    if (text.length < 500) return;
    const score = detectAIText(text.substring(0, 10000));
    const threshold = extensionSettings.aiDetectorSensitivity || 60;
    if (score > threshold) showAIBadge(score);
  }, 3000);
}

function detectAIText(text) {
  let score = 0;
  const passiveCount = (text.match(/(\bwas\b|\bwere\b|\bbeing\b|\bby\b)/gi) || []).length;
  const structureCount = (text.match(/(\.\s[A-Z][a-z]{3,})/g) || []).length;
  const formalCount = (text.match(/(\bthus\b|\btherefore\b|\bin conclusion\b|\bmoreover\b)/gm) || []).length;
  const wordCount = text.split(/\s+/).length;
  score += (passiveCount / wordCount * 100) * 0.3;
  score += (structureCount / text.split('.').length * 100) * 0.4;
  score += (formalCount / Math.max(1, text.split('\n').length) * 100) * 0.3;
  return Math.min(100, Math.round(score));
}

function showAIBadge(score) {
  if (!elementVisibility.aiBadge) return;
  if (document.getElementById('aitools-ai-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'aitools-ai-badge';
  badge.style.cssText = `
    position: fixed; top: 80px; right: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    z-index: 9999; box-shadow: 0 4px 16px rgba(255,107,107,0.3); cursor: grab;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex; align-items: center; justify-content: space-between; gap: 8px; user-select: none;
  `;

  const scoreSpan = document.createElement('span');
  scoreSpan.textContent = `⚠️ IA: ${score}%`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
  closeBtn.addEventListener('click', () => {
    elementVisibility.aiBadge = false;
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
    badge.remove();
  });

  badge.appendChild(scoreSpan);
  badge.appendChild(closeBtn);
  document.body.appendChild(badge);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-ai-badge', badge, { width: 160, height: 40, priority: 2, draggable: true });
  }
  makeDraggable(badge, 'aitools-ai-badge-pos');
  setTimeout(() => { if (badge.isConnected) badge.style.opacity = '0.7'; }, 3000);
}

// ============================================================================
// SUMMARIZER
// ============================================================================
function initSummarizer() {
  if (buttonVisibility.summarizerButton === false) return;
  if (window.location.hostname.includes('google.')) return;
  if (!extensionSettings.summarizerEnabled) return;

  setTimeout(() => { checkAndShowSummarizerButton(); }, 1500);

  const obs = new MutationObserver(() => setTimeout(checkAndShowSummarizerButton, 500));
  obs.observe(document.body, { childList: true, subtree: true });
}

function checkAndShowSummarizerButton() {
  const pageText = document.body.innerText;
  if (!document.getElementById('aitools-summarize-btn') && pageText.length > 800) {
    addSummarizerButton();
  } else if (document.getElementById('aitools-summarize-btn') && pageText.length < 300) {
    document.getElementById('aitools-summarize-btn')?.remove();
  }
}

function addSummarizerButton() {
  const btn = document.createElement('button');
  btn.id = 'aitools-summarize-btn';
  btn.style.cssText = `
    position: fixed; top: 20px; right: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; border: none; padding: 10px 14px; border-radius: 6px;
    font-size: 12px; font-weight: 600; cursor: grab; z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex; align-items: center; gap: 8px; user-select: none;
  `;

  const textSpan = document.createElement('span');
  textSpan.textContent = '✂️ Résumer';
  textSpan.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elementVisibility.summarizerBtn = false;
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
    btn.remove();
  });

  btn.appendChild(textSpan);
  btn.appendChild(closeBtn);

  btn.addEventListener('click', (e) => {
    if (!e.target.closest('.aitools-close-btn')) {
      showSummaryModal(betterSummarize(summarizePage()));
    }
  });

  document.body.appendChild(btn);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-summarizer-btn', btn, { width: 140, height: 40, priority: 2, draggable: true });
  }
  makeDraggable(btn, 'aitools-summarize-btn-pos');
}

function summarizePage() {
  return Array.from(document.querySelectorAll('p, article, section, div[role="main"]'))
    .map(el => el.innerText).filter(t => t.length > 100).slice(0, 20).join('\n\n');
}

function betterSummarize(text) {
  if (!text || text.length < 100) return text;
  let cleanText = text.replace(/\s+/g, ' ').trim();
  let sentences = [];
  let current = '';
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    current += char;
    if ((char === '.' || char === '!' || char === '?') && i < cleanText.length - 1) {
      const nextChar = cleanText[i + 1];
      if (nextChar === ' ') { sentences.push(current.trim()); current = ''; }
    } else if ((char === '.' || char === '!' || char === '?') && i === cleanText.length - 1) {
      sentences.push(current.trim()); current = '';
    }
  }
  if (current.length > 0) sentences.push(current.trim());
  sentences = sentences.filter(s => s.length > 20 && s.split(/\s+/).length > 3);
  if (sentences.length === 0) return text.substring(0, 300) + '...';
  if (sentences.length <= 2) return sentences.join(' ');

  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','be','is','are','was','were','le','la','les','de','du','des','et','ou','un','une','en','à','pour','que','qui']);
  const allWords = cleanText.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const wordFreq = {};
  allWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

  const scored = sentences.map((sentence, idx) => {
    let score = 1;
    const words = sentence.toLowerCase().split(/\s+/);
    if (idx === 0) score += 5;
    if (idx === sentences.length - 1) score += 4;
    words.forEach(w => { if (wordFreq[w] > 1 && !stopWords.has(w)) score += Math.log(wordFreq[w] + 1); });
    if (/\d+%/.test(sentence)) score += 6;
    else if (/\d+/.test(sentence)) score += 2;
    const wc = words.length;
    if (wc >= 15 && wc <= 50) score += 4;
    return { sentence, score, index: idx };
  });

  const pct = Math.max(0.15, Math.min(0.8, (extensionSettings.summarizerLength || 35) / 100));
  const keepCount = Math.max(2, Math.ceil(sentences.length * pct));
  return scored.sort((a, b) => b.score - a.score).slice(0, keepCount).sort((a, b) => a.index - b.index).map(s => s.sentence).join(' ');
}

function showSummaryModal(summary) {
  const overlay = document.createElement('div');
  overlay.id = 'aitools-summary-overlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;`;

  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:12px;max-width:600px;max-height:70vh;overflow-y:auto;z-index:10001;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif;`;

  modal.innerHTML = `
    <h3 style="margin-top:0;color:#333;">📋 Résumé de la page</h3>
    <p style="line-height:1.8;color:#555;font-size:13px;">${summary.replace(/\n/g, '<br>')}</p>
    <button id="aitools-close-summary" style="background:#667eea;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:16px;font-size:12px;display:block;width:100%;">Fermer</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector('#aitools-close-summary');
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); overlay.remove(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================================
// AUTO TRANSLATOR
// ============================================================================
function detectLanguageOfText(text) {
  if (!text || text.length < 5) return null;
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) {
    const lc = htmlLang.substring(0, 2).toLowerCase();
    if (['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh'].includes(lc)) return lc;
  }
  const tc = text.substring(0, 5000);
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/g.test(text)) return 'zh';
  const scores = {
    'fr': (/(ç|œ|é|è|ê|ë|à|ù|û)/i.test(tc) ? 3 : 0) + (/\b(le|la|les|de|des|et|est|sont|avec|pour)\b/i.test(tc) ? 2 : 0),
    'es': (/(á|é|í|ó|ú|ñ|¡|¿)/i.test(tc) ? 3 : 0) + (/\b(el|la|los|que|una|está|son)\b/i.test(tc) ? 2 : 0),
    'de': (/(ä|ö|ü|ß)/i.test(tc) ? 3 : 0) + (/\b(der|die|das|und|ist|sind|mit)\b/i.test(tc) ? 2 : 0),
    'it': (/\b(il|lo|la|che|è|sono|una|per)\b/i.test(tc) ? 3 : 0),
    'pt': (/(ã|õ|ç)/i.test(tc) ? 3 : 0) + (/\b(o|a|os|que|é|uma|com)\b/i.test(tc) ? 2 : 0)
  };
  const max = Math.max(...Object.values(scores));
  if (max > 3) return Object.keys(scores).find(l => scores[l] === max);
  return 'en';
}

function initAutoTranslator() {
  if (buttonVisibility.translationButtons === false) return;
  if (!extensionSettings.autoTranslatorEnabled) return;
  if (window.location.hostname.includes('google.')) return;

  setTimeout(() => {
    const pageText = document.body.innerText;
    if (pageText.length < 200) return;
    const pageLang = detectLanguageOfText(pageText);
    const targetLang = extensionSettings.translatorTargetLang || 'fr';
    if (pageLang && pageLang !== targetLang) addTranslatorButton(pageLang, targetLang);
  }, 1500);
}

function addTranslatorButton(sourceLang, targetLang) {
  if (document.getElementById('aitools-translator-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'aitools-translator-btn';
  btn.style.cssText = `position:fixed;top:60px;right:100px;background:linear-gradient(135deg,#4CAF50 0%,#45a049 100%);color:white;border:none;padding:10px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:grab;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;gap:8px;user-select:none;`;

  const textSpan = document.createElement('span');
  textSpan.textContent = '🌐 Traduire';
  textSpan.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); btn.style.display = 'none'; });

  btn.appendChild(textSpan);
  btn.appendChild(closeBtn);
  btn.addEventListener('click', (e) => {
    if (!e.target.closest('.aitools-close-btn')) {
      translateAndShowModal(document.body.innerText, sourceLang, targetLang);
    }
  });

  document.body.appendChild(btn);
  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-translator-btn', btn, { width: 130, height: 40, priority: 3, draggable: true });
  }
  makeDraggable(btn, 'aitools-translator-btn-pos');
}

function translateAndShowModal(text, sourceLang, targetLang) {
  const btn = document.getElementById('aitools-translator-btn');
  const spanEl = btn?.querySelector('span');
  if (spanEl) spanEl.textContent = '⏳ Traduction...';
  if (btn) btn.disabled = true;

  const textToTranslate = text.substring(0, 500);
  chrome.runtime.sendMessage(
    { action: 'translateText', text: textToTranslate, sourceLang, targetLang },
    (response) => {
      if (spanEl) spanEl.textContent = '🌐 Traduire';
      if (btn) btn.disabled = false;

      if (response && response.success) {
        showTranslationModal(textToTranslate, response.text, sourceLang, targetLang);
      } else {
        alert('❌ Erreur lors de la traduction.');
      }
    }
  );
}

function showTranslationModal(original, translated, sourceLang, targetLang) {
  const langNames = { fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien', pt: 'Portugais', ja: 'Japonais', zh: 'Chinois' };
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;`;

  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:12px;max-width:700px;max-height:80vh;overflow-y:auto;z-index:10001;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif;`;
  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;color:#333;">🌐 Traduction</h3>
      <button id="aitools-close-tr" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <p style="margin:0 0 8px;font-weight:600;font-size:11px;color:#666;">📄 ${langNames[sourceLang] || sourceLang}</p>
        <div style="background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px;line-height:1.6;color:#555;max-height:250px;overflow-y:auto;">${original.replace(/\n/g, '<br>')}</div>
      </div>
      <div>
        <p style="margin:0 0 8px;font-weight:600;font-size:11px;color:#666;">✅ ${langNames[targetLang] || targetLang}</p>
        <div style="background:#e8f5e9;padding:12px;border-radius:8px;font-size:12px;line-height:1.6;color:#333;max-height:250px;overflow-y:auto;">${translated.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button id="aitools-copy-tr" style="flex:1;background:#667eea;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">📋 Copier</button>
      <button id="aitools-close-tr2" style="flex:1;background:#ddd;color:#333;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Fermer</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#aitools-close-tr').addEventListener('click', () => overlay.remove());
  modal.querySelector('#aitools-close-tr2').addEventListener('click', () => overlay.remove());
  modal.querySelector('#aitools-copy-tr').addEventListener('click', () => {
    navigator.clipboard.writeText(translated).then(() => alert('✅ Copié !'));
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================================
// QUICK STATS
// ============================================================================
function initQuickStats() {
  if (buttonVisibility.quickStatsWidget === false) return;
  const hostname = window.location.hostname;
  if (hostname.includes('google.') || hostname.includes('facebook.') || hostname.includes('twitter.') ||
    hostname.includes('instagram.') || hostname.includes('youtube.') || hostname.includes('reddit.')) return;

  setTimeout(() => {
    const stats = {
      images: document.querySelectorAll('img').length,
      links: document.querySelectorAll('a').length,
      paragraphs: document.querySelectorAll('p').length,
      headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      videos: document.querySelectorAll('iframe[src*="youtube"],iframe[src*="vimeo"]').length,
      forms: document.querySelectorAll('form').length,
      buttons: document.querySelectorAll('button').length,
      tables: document.querySelectorAll('table').length,
      codeBlocks: document.querySelectorAll('code,pre').length
    };
    if (stats.links + stats.forms + stats.buttons < 3) return;
    createStatsWidget(stats);
  }, 4000);
}

function createStatsWidget(stats) {
  const widget = document.createElement('div');
  widget.id = 'aitools-quick-stats';
  widget.style.cssText = `position:fixed;bottom:20px;right:20px;background:rgba(255,255,255,0.95);border:1px solid #e0e0e0;border-radius:12px;padding:0;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:999998;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:280px;cursor:pointer;user-select:none;transition:all 0.3s ease;`;

  const header = document.createElement('div');
  header.style.cssText = `background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:10px 14px;border-radius:12px;font-weight:600;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;`;

  const headerLabel = document.createElement('span');
  headerLabel.textContent = '📊 Statistiques page';
  headerLabel.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    widget.style.display = 'none';
    buttonVisibility.quickStatsWidget = false;
    chrome.storage.local.set({ buttonVisibility });
  });

  header.appendChild(headerLabel);
  header.appendChild(closeBtn);

  let isExpanded = false;
  const content = document.createElement('div');
  content.style.cssText = `padding:0 14px;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;`;

  const rows = [
    { label: '🔗 Liens', value: stats.links }, { label: '🖼️ Images', value: stats.images },
    { label: '📝 Paragraphes', value: stats.paragraphs }, { label: '📰 Titres', value: stats.headings },
    { label: '🎥 Vidéos', value: stats.videos }, { label: '📋 Formulaires', value: stats.forms },
    { label: '🔘 Boutons', value: stats.buttons }, { label: '📊 Tableaux', value: stats.tables },
    { label: '💻 Code', value: stats.codeBlocks }
  ];

  content.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 0;">' +
    rows.filter(r => r.value > 0).map(r => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:11px;">
        <span style="color:#666;">${r.label}</span>
        <span style="color:#667eea;font-weight:600;">${r.value}</span>
      </div>
    `).join('') + '</div>';

  header.addEventListener('click', (e) => {
    if (e.target.closest('.aitools-close-btn')) return;
    isExpanded = !isExpanded;
    content.style.maxHeight = isExpanded ? '300px' : '0';
    content.style.padding = isExpanded ? '0 14px' : '0 14px';
  });

  widget.appendChild(header);
  widget.appendChild(content);
  document.body.appendChild(widget);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-quick-stats', widget, { width: 280, height: 50, priority: 5, draggable: true });
  }
  makeDraggable(widget, 'aitools-quick-stats-pos');
}

// ============================================================================
// READING TIME
// ============================================================================
function initReadingTime() {
  if (buttonVisibility.readingTimeBadge === false) return;
  const hostname = window.location.hostname;
  if (hostname.includes('google.') || hostname.includes('facebook.') || hostname.includes('twitter.') ||
    hostname.includes('instagram.') || hostname.includes('youtube.') || hostname.includes('reddit.')) return;
  if (!extensionSettings.readingTimeEnabled) return;

  setTimeout(() => {
    const mainEl = document.querySelector('article') || document.querySelector('[role="main"]') || document.querySelector('main') || document.body;
    const content = (mainEl?.innerText || '').slice(0, 50000);
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const mins = Math.ceil(words / 225);
    if (mins < 1 || words < 300) return;

    const badge = document.createElement('div');
    badge.id = 'aitools-reading-time';
    badge.style.cssText = `position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 4px 12px rgba(102,126,234,0.4);z-index:999999;cursor:pointer;user-select:none;transition:all 0.3s ease;`;
    badge.innerHTML = `📖 ${mins} min`;
    badge.title = `${words.toLocaleString('fr-FR')} mots`;

    document.body.appendChild(badge);
    let hideTimer = setTimeout(() => { if (badge.isConnected) badge.style.opacity = '0.35'; }, 5000);
    badge.addEventListener('mouseover', () => { clearTimeout(hideTimer); badge.style.opacity = '1'; });
    badge.addEventListener('mouseout', () => { hideTimer = setTimeout(() => { badge.style.opacity = '0.35'; }, 5000); });
    makeDraggable(badge, 'aitools-reading-time-pos');
  }, 4000);
}

// ============================================================================
// FOCUS MODE
// ============================================================================
function initFocusMode() {
  // Keyboard shortcut always available
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      toggleFocusMode();
    }
  });

  // Create button only if enabled in settings
  if (buttonVisibility.focusModeBadge === false) return;

  // Ensure body exists before appending
  const createFocusBtn = () => {
    if (!document.body) {
      setTimeout(createFocusBtn, 100);
      return;
    }

    if (document.getElementById('aitools-focus-mode-btn')) return;

    const focusBtn = document.createElement('button');
    focusBtn.id = 'aitools-focus-mode-btn';
    focusBtn.innerHTML = '🎯';
    focusBtn.title = 'Shift+Alt+F : Mode focus';
    focusBtn.style.cssText = `position:fixed;top:80px;right:20px;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border:2px solid white;color:white;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(245,87,108,0.4);z-index:999998;user-select:none;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;`;

    const closeX = document.createElement('div');
    closeX.style.cssText = `position:absolute;top:-8px;right:-8px;width:18px;height:18px;border-radius:50%;background:#ff4757;color:white;border:none;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:bold;`;
    closeX.textContent = '✕';
    closeX.addEventListener('click', (e) => {
      e.stopPropagation();
      disableFocusMode();
      // Save that the button should be hidden
      buttonVisibility.focusModeBadge = false;
      chrome.storage.local.set({ buttonVisibility });
      focusBtn.remove();
    });

    focusBtn.appendChild(closeX);
    focusBtn.addEventListener('click', (e) => {
      if (e.target === closeX) return;
      toggleFocusMode();
    });
    focusBtn.addEventListener('mouseover', () => {
      focusBtn.style.transform = 'scale(1.1)';
    });
    focusBtn.addEventListener('mouseout', () => {
      focusBtn.style.transform = 'scale(1)';
    });

    document.body.appendChild(focusBtn);
  };

  // Use setTimeout to ensure DOM is ready
  setTimeout(createFocusBtn, 0);
}

function toggleFocusMode() {
  if (document.body.getAttribute('data-aitools-focus') === 'active') {
    disableFocusMode();
  } else {
    enableFocusMode();
  }
}

function enableFocusMode() {
  document.body.setAttribute('data-aitools-focus', 'active');
  if (!document.getElementById('aitools-focus-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'aitools-focus-mode-styles';
    style.textContent = `
      [class*="ad"],[class*="advertisement"],[id*="ad"],[id*="advertisement"],
      [class*="sidebar"],[id*="sidebar"],[class*="widget"],[id*="widget"],
      [class*="footer"],[id*="footer"],[class*="nav"],[id*="nav"],
      [role="complementary"],[role="navigation"],.header,#header,header,
      .notification,.banner,.popup,.modal:not(#aitools-modal),
      iframe[src*="ads"],iframe[src*="doubleclick"],[data-ad-format],[data-ad-slot]
      { display:none !important; }
      body,main,article,[role="main"],.content,.post,.article { margin:0!important;padding:20px!important;max-width:100%!important; }
      body { background-color:#fafafa!important;line-height:1.8!important; }
    `;
    document.head.appendChild(style);
  }
  showFocusNotification('🎯 Mode focus activé ! Shift+Alt+F pour désactiver');
  const btn = document.getElementById('aitools-focus-mode-btn');
  if (btn) btn.style.background = 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)';
  extensionSettings.focusModeEnabled = true;
  chrome.storage.local.set({ focusModeEnabled: true });
}

function disableFocusMode() {
  document.body.removeAttribute('data-aitools-focus');
  const style = document.getElementById('aitools-focus-mode-styles');
  if (style) style.remove();
  showFocusNotification('Mode focus désactivé');
  const btn = document.getElementById('aitools-focus-mode-btn');
  if (btn) btn.style.background = 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)';
  extensionSettings.focusModeEnabled = false;
  chrome.storage.local.set({ focusModeEnabled: false });
}

function showFocusNotification(message) {
  const existing = document.getElementById('aitools-focus-notification');
  if (existing) existing.remove();
  const n = document.createElement('div');
  n.id = 'aitools-focus-notification';
  n.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(32,32,32,0.95);color:white;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:1000000;animation:aitoolsFadeInOut 2s ease-in-out;pointer-events:none;`;
  n.innerHTML = message;
  if (!document.getElementById('aitools-focus-anim')) {
    const s = document.createElement('style');
    s.id = 'aitools-focus-anim';
    s.textContent = `@keyframes aitoolsFadeInOut{0%{opacity:0;transform:translate(-50%,-50%) scale(0.8);}10%{opacity:1;transform:translate(-50%,-50%) scale(1);}90%{opacity:1;}100%{opacity:0;}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================
chrome.storage.local.get(null, (data) => {
  extensionEnabled = data.extensionEnabled !== false;
  darkModeEnabled = data.darkModeEnabled === true;

  // Initialize defaults for Google buttons if not set
  if (!data.googleButtonsVisibility) {
    chrome.storage.local.set({
      googleButtonsVisibility: { lucky: true, filters: true, maps: true, chatgpt: true }
    });
  }
  if (!data.googleButtonsConfig) {
    chrome.storage.local.set({
      googleButtonsConfig: {
        lucky: { label: '🍀 Chance', action: 'lucky', color: '#5f6368' },
        filters: { label: '🔍 Filtres', action: 'filters', color: '#5f6368' },
        maps: { label: '🗺️ Maps', action: 'maps', color: '#5f6368' },
        chatgpt: { label: '🤖 ChatGPT', action: 'chatgpt', color: '#5f6368' }
      }
    });
  }

  if (!extensionEnabled) return;

  if (darkModeEnabled) enableDarkMode();

  if (data.buttonVisibility) {
    buttonVisibility = { ...buttonVisibility, ...data.buttonVisibility };
  }

  setupHighlighter();
  setupGoogleEnhancements();

  if (data.focusModeEnabled) enableFocusMode();
  if (data.blockSponsoredEnabled) setTimeout(blockSponsoredResults, 2000);

  if (data.readingTimeEnabled !== false) {
    extensionSettings.readingTimeEnabled = true;
    initReadingTime();
  }
});

chrome.storage.local.get(null, (data) => {
  if (data.aiDetectorEnabled !== undefined) extensionSettings.aiDetectorEnabled = data.aiDetectorEnabled;
  if (data.summarizerEnabled !== undefined) extensionSettings.summarizerEnabled = data.summarizerEnabled;
  if (data.autoTranslatorEnabled !== undefined) extensionSettings.autoTranslatorEnabled = data.autoTranslatorEnabled;
  if (data.translatorTargetLang) extensionSettings.translatorTargetLang = data.translatorTargetLang;
  if (data.cookieBlockerEnabled !== undefined) extensionSettings.cookieBlockerEnabled = data.cookieBlockerEnabled;
  if (data.performanceModeEnabled !== undefined) extensionSettings.performanceModeEnabled = data.performanceModeEnabled;

  if (!extensionSettings.performanceModeEnabled) {
    initAIDetector();
  }
  initSummarizer();
  initAutoTranslator();
  initCookieBlocker();
  initQuickStats();
  initFocusMode();
});

// ============================================================================
// MESSAGE LISTENER
// ============================================================================
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'resetPositions' || req.action === 'resetButtonPositions') {
    chrome.storage.local.get(null, (data) => {
      const keys = Object.keys(data).filter(k => k.includes('-pos') && k.includes('aitools'));
      if (keys.length > 0) {
        chrome.storage.local.remove(keys, () => location.reload());
      } else {
        location.reload();
      }
    });

  } else if (req.action === 'updateButtonVisibility') {
    const { buttonType, isVisible } = req;
    buttonVisibility[buttonType] = isVisible;

    if (buttonType === 'googleButtons') {
      const c = document.getElementById('aitools-google-buttons');
      if (c) c.style.display = isVisible ? 'flex' : 'none';
    } else if (buttonType === 'summarizerButton') {
      const b = document.getElementById('aitools-summarize-btn');
      if (b) b.style.display = isVisible ? 'flex' : 'none';
    } else if (buttonType === 'aiDetectorBadge') {
      const b = document.getElementById('aitools-ai-badge');
      if (b) b.style.display = isVisible ? 'flex' : 'none';
    } else if (buttonType === 'translationButtons') {
      const b = document.getElementById('aitools-translator-btn');
      if (b) b.style.display = isVisible ? 'flex' : 'none';
    } else if (buttonType === 'quickStatsWidget') {
      const w = document.getElementById('aitools-quick-stats');
      if (w) w.style.display = isVisible ? 'block' : 'none';
    } else if (buttonType === 'readingTimeBadge') {
      const b = document.getElementById('aitools-reading-time');
      if (b) b.style.display = isVisible ? 'flex' : 'none';
    } else if (buttonType === 'focusModeBadge') {
      const b = document.getElementById('aitools-focus-mode-btn');
      if (b) b.style.display = isVisible ? 'flex' : 'none';
      buttonVisibility.focusModeBadge = isVisible;
      chrome.storage.local.set({ buttonVisibility });
    } else if (buttonType === 'notesHighlighter') {
      highlighterEnabled = isVisible;
      if (!isVisible) {
        const menu = document.getElementById('aitools-highlight-menu');
        if (menu) menu.remove();
      }
    }

  } else if (req.action === 'togglePerformanceMode') {
    const b = document.getElementById('aitools-ai-badge');
    if (b) b.style.display = req.enabled ? 'none' : 'flex';

  } else if (req.action === 'updateGoogleButtons') {
    if (req.visibility) chrome.storage.local.set({ googleButtonsVisibility: req.visibility });
    if (req.config) chrome.storage.local.set({ googleButtonsConfig: req.config });
    const c = document.getElementById('aitools-google-buttons');
    if (c) { c.remove(); }

  } else if (req.action === 'updateSettings') {
    extensionSettings = { ...extensionSettings, ...req.settings };
    if (req.settings.cookieBlockerEnabled !== undefined) {
      if (req.settings.cookieBlockerEnabled && !cookieObserver) initCookieBlocker();
      else if (!req.settings.cookieBlockerEnabled && cookieObserver) {
        cookieObserver.disconnect();
        cookieObserver = null;
      }
    }

  } else if (req.action === 'toggleDarkMode') {
    req.enabled ? enableDarkMode() : disableDarkMode();

  } else if (req.action === 'toggleExtension') {
    extensionEnabled = req.enabled;

  } else if (req.action === 'blockSponsored') {
    if (req.enabled) blockSponsoredResults();

  } else if (req.action === 'extractText') {
    const text = document.body.innerText
      .split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 500)
      .slice(0, 100).join(' ');
    sendResponse({ text: text || null });
    return true;

  } else if (req.action === 'setLayout') {
    if (window.layoutManager) window.layoutManager.setLayout(req.layout);

  } else if (req.action === 'resetLayout') {
    if (window.layoutManager) window.layoutManager.resetPositions();
  }

  sendResponse({ status: 'ok' });
});

if (DEBUG) console.log('[AITools] Content script v4.0 ready');
