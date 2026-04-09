// AITools Content Script v4.0 - Optimized
// All features: Reading time, Dark mode, Notes, Google enhancements, Sponsor blocker, AI detector, Summarizer

const DEBUG = false;

// ============================================================================
// INJECT PAGE SCRIPT FOR PROMPT API ACCESS
// ============================================================================

function injectPageScript() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ai-injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    console.log('[Content] ✅ Page script injected successfully');
  } catch (error) {
    console.error('[Content] ❌ Failed to inject page script:', error);
  }
}

// Inject immediately on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPageScript);
} else {
  injectPageScript();
}

let extensionEnabled = true;
let darkModeEnabled = false;
let highlighterEnabled = true;
let cookieBlockerPaused = false; // For cookie blocker pause state

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

// ============================================================================
// BUTTON POSITIONING SYSTEM - Smart responsive layout
// ============================================================================

const ButtonManager = {
  buttons: [],
  isSmallScreen: () => window.innerWidth < 768,
  
  registerButton(id, element) {
    this.buttons.push({ id, element });
    this.updatePositions();
    window.addEventListener('resize', () => this.updatePositions());
  },
  
  updatePositions() {
    const isSmall = this.isSmallScreen();
    const baseRight = isSmall ? '15px' : '20px';
    const baseLeft = isSmall ? 'auto' : 'auto';
    const baseBottom = isSmall ? '20px' : 'auto';
    const baseTop = isSmall ? 'auto' : '20px';
    
    // Stack buttons vertically on mobile at bottom, desktop at top-right
    this.buttons.forEach((btn, idx) => {
      if (btn.element && !btn.element.parentElement) return; // element removed
      
      const spacing = 50; // 40px button + 10px gap
      const positionValue = isSmall ? (idx * spacing) : (idx * spacing);
      
      let css = `position: fixed; z-index: ${9999 - idx}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease;`;
      
      if (isSmall) {
        // Mobile: stack at bottom-left
        css += `bottom: ${baseBottom}; left: 15px; top: auto; right: auto; margin-bottom: ${positionValue}px;`;
      } else {
        // Desktop: stack at top-right
        css += `top: ${20 + positionValue}px; right: ${baseRight}; bottom: auto; left: auto;`;
      }
      
      if (btn.element.style.cssText && btn.element.style.cssText.includes('position:fixed')) {
        // Preserve existing styles, just update position
        const existing = btn.element.getAttribute('data-original-css') || btn.element.style.cssText;
        btn.element.setAttribute('data-original-css', existing);
        btn.element.style.cssText = css;
      }
    });
  },
  
  removeButton(id) {
    this.buttons = this.buttons.filter(b => b.id !== id);
  }
};

// ============================================================================
// UTILITIES: Bug Fixes #10-16 (Memory Leaks, XSS, Storage, Observers)
// ============================================================================

// Bug #10-13 Fix: Subscription & Observer Managers
const SubscriptionManager = {
  subscriptions: new Map(),
  subscribe(id, element, event, handler, options = {}) {
    if (!this.subscriptions.has(id)) this.subscriptions.set(id, []);
    element.addEventListener(event, handler, options);
    this.subscriptions.get(id).push({ element, event, handler, options });
  },
  unsubscribe(id) {
    if (!this.subscriptions.has(id)) return;
    this.subscriptions.get(id).forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.subscriptions.delete(id);
  },
  unsubscribeAll() {
    this.subscriptions.forEach((_, id) => this.unsubscribe(id));
    console.log('[AITools] ✅ Subscriptions cleaned');
  }
};

const ObserverManager = {
  observers: new Map(),
  observe(id, target, callback, options = {}) {
    if (this.observers.has(id)) this.observers.get(id).disconnect();
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    this.observers.set(id, observer);
    return observer;
  },
  disconnect(id) {
    if (this.observers.has(id)) {
      this.observers.get(id).disconnect();
      this.observers.delete(id);
    }
  },
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    console.log('[AITools] ✅ Observers disconnected');
  }
};

// Bug #9 Fix: XSS Prevention
function sanitizeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Bug #14 Fix: Throttle & Debounce
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, delay = 500) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Bug #16 Fix: Safe Storage
function setStorageSafe(key, value) {
  try {
    const size = JSON.stringify(key + JSON.stringify(value)).length;
    if (size > 100000) {
      console.warn('[AITools] Storage item too large:', size);
      return false;
    }
    chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error('[AITools] Storage error:', error);
    return false;
  }
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  SubscriptionManager.unsubscribeAll();
  ObserverManager.disconnectAll();
});

// ============================================================================
// ASYNC INITIALIZATION - Fixes race condition (Bug #1)
// ============================================================================

(async () => {
  try {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      await new Promise(resolve => 
        document.addEventListener('DOMContentLoaded', resolve, { once: true })
      );
    }

    // Charger TOUS les paramètres en une seule requête
    const data = await new Promise(resolve => 
      chrome.storage.local.get(null, resolve)
    );

    // Assigner les valeurs avec fallbacks
    extensionEnabled = data.extensionEnabled !== false;
    darkModeEnabled = data.darkModeEnabled === true;

    if (data.aiDetectorSensitivity) extensionSettings.aiDetectorSensitivity = parseInt(data.aiDetectorSensitivity);
    if (data.summarizerLength) extensionSettings.summarizerLength = parseInt(data.summarizerLength);
    if (data.summarizerLang) extensionSettings.summarizerLang = data.summarizerLang;
    if (data.autoTranslatorEnabled !== undefined) extensionSettings.autoTranslatorEnabled = data.autoTranslatorEnabled;
    if (data.translatorTargetLang) extensionSettings.translatorTargetLang = data.translatorTargetLang;
    if (data.cookieBlockerEnabled !== undefined) extensionSettings.cookieBlockerEnabled = data.cookieBlockerEnabled;
    if (data.readingTimeEnabled !== undefined) extensionSettings.readingTimeEnabled = data.readingTimeEnabled;
    if (data.quickStatsEnabled !== undefined) extensionSettings.quickStatsEnabled = data.quickStatsEnabled;
    if (data.performanceModeEnabled !== undefined) extensionSettings.performanceModeEnabled = data.performanceModeEnabled;
    if (data.aiDetectorEnabled !== undefined) extensionSettings.aiDetectorEnabled = data.aiDetectorEnabled;
    if (data.summarizerEnabled !== undefined) extensionSettings.summarizerEnabled = data.summarizerEnabled;
    if (data.focusModeEnabled !== undefined) extensionSettings.focusModeEnabled = data.focusModeEnabled;

    if (data['aitools-visibility']) {
      elementVisibility = { ...elementVisibility, ...data['aitools-visibility'] };
    }
    if (data.buttonVisibility) {
      buttonVisibility = { ...buttonVisibility, ...data.buttonVisibility };
    }

    // highlighterEnabled dépend de buttonVisibility
    highlighterEnabled = buttonVisibility.notesHighlighter !== false;

    // Initialiser les valeurs par défaut Google buttons
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

    console.log('[AITools] ✅ Initialization complete', { extensionEnabled, darkModeEnabled });

    // Inject global animations
    if (!document.getElementById('aitools-global-animations')) {
      const style = document.createElement('style');
      style.id = 'aitools-global-animations';
      style.textContent = `
        @keyframes aitools-slide-in {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        @keyframes aitools-slide-out {
          from { 
            transform: translateY(0); 
            opacity: 1; 
          }
          to { 
            transform: translateY(20px); 
            opacity: 0; 
          }
        }
        @keyframes aitools-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aitools-slide-up {
          from { 
            transform: translate(-50%, -40%);
            opacity: 0;
          }
          to { 
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
        @keyframes aitools-slide-down {
          from { 
            transform: translate(-50%, -50%);
            opacity: 1;
          }
          to { 
            transform: translate(-50%, -40%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Initialiser tous les modules dans l'ordre correct
    if (darkModeEnabled) enableDarkMode();

    setupHighlighter();
    setupGoogleEnhancements();

    if (data.blockSponsoredEnabled) setTimeout(blockSponsoredResults, 2000);
    if (extensionSettings.focusModeEnabled) initFocusMode();

    if (extensionSettings.readingTimeEnabled) initReadingTime();

    if (!extensionSettings.performanceModeEnabled) {
      initAIDetector();
    }

    initSummarizer();
    initAutoTranslator();
    initCookieBlocker();
    initQuickStats();
    initExtension(); // Shadow DOM interface

  } catch (error) {
    console.error('[AITools] ❌ Initialization error:', error);
  }
})();

// ============================================================================
// DRAGGABLE UTILITY - Bug Fix #10: Memory Leak Free
// ============================================================================
function makeDraggable(element, storageKey) {
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

  // Bug #10 Fix: Named handlers for cleanup
  const handleMouseDown = (e) => {
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
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    dragDistance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
    if (dragDistance < dragThreshold) return;
    element.style.left = (e.clientX + offsetX) + 'px';
    element.style.top = (e.clientY + offsetY) + 'px';
    element.style.right = 'auto';
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    element.style.cursor = 'grab';
    element.style.zIndex = '10000';
    if (dragDistance >= dragThreshold) {
      const rect = element.getBoundingClientRect();
      setStorageSafe(storageKey, { top: rect.top, left: rect.left });
    }
  };

  element.addEventListener('mousedown', handleMouseDown);

  // Bug #10 Fix: Store cleanup function
  element._dragCleanup = () => {
    element.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Start drag listeners only when needed
  const startDragListeners = () => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Modify handleMouseDown to start/stop listeners
  const originalMouseDown = handleMouseDown;
  element.removeEventListener('mousedown', handleMouseDown);
  element.addEventListener('mousedown', (e) => {
    originalMouseDown(e);
    startDragListeners();
  });

  element.style.cursor = 'grab';
}

// ============================================================================
// SHADOW DOM INTERFACE - Bug Fix #11: CSS Isolation (No double injection)
// ============================================================================
function initExtension() {
  try {
    // Bug #11 Fix: Check if already exists
    if (document.getElementById('ai-tools-container')) {
      console.log('[AITools] ✅ Shadow DOM already exists, skipping');
      return;
    }
    
    if (!document.body) {
      console.warn('[AITools] ⚠️ document.body not ready yet');
      return;
    }

    // Créer le conteneur principal
    const aiToolsContainer = document.createElement('div');
    aiToolsContainer.id = 'ai-tools-container';
    
    // Attacher Shadow Root (mode open pour debugger)
    const shadowRoot = aiToolsContainer.attachShadow({ mode: 'open' });
    
    // Injecter le CSS via <link>
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles-new.css');
    styleLink.onerror = () => console.error('[AITools] Failed to load styles-new.css');
    
    // Créer le div racine de l'app
    const appRoot = document.createElement('div');
    appRoot.id = 'app-root';
    appRoot.className = 'aitools-sidebar';
    
    // Ajouter au Shadow Root
    shadowRoot.appendChild(styleLink);
    shadowRoot.appendChild(appRoot);
    
    // Injecter le conteneur dans la page
    document.body.appendChild(aiToolsContainer);
    
    // Store cleanup function
    aiToolsContainer.cleanup = function() {
      if (this.isConnected) this.remove();
    };
    
    console.log('[AITools] ✅ Shadow DOM interface created (single instance)');
  } catch (error) {
    console.error('[AITools] ❌ Shadow DOM creation failed:', error);
  }
}

// ============================================================================
// BUG FIX #2: Detect Search on Google (Hash-based routing)
// ============================================================================
function hasActiveSearch() {
  try {
    const url = new URL(window.location);
    
    // Vérifier en query string (?q=...)
    let query = url.searchParams.get('q');
    
    // Fallback : vérifier en hash (#q=...) pour routing client-side
    if (!query && url.hash) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      query = hashParams.get('q');
    }
    
    return query && query.trim().length > 0;
  } catch (error) {
    console.warn('[AITools] Error detecting search:', error);
    return false;
  }
}

// ============================================================================
// BUG FIX #4: Focus Mode with preventDefault
// ============================================================================
function initFocusMode() {
  if (!document.body) return;
  
  const handleFocusModeTrigger = (e) => {
    // Ctrl+Shift+F ou Cmd+Shift+F
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyF') {
      e.preventDefault();  // ← Crucial !
      e.stopPropagation();
      toggleFocusMode();
      return false;
    }
  };
  
  document.addEventListener('keydown', handleFocusModeTrigger, true);
  console.log('[AITools] Focus Mode initialized | Shortcut: Ctrl+Shift+F');
}

function toggleFocusMode() {
  extensionSettings.focusModeEnabled = !extensionSettings.focusModeEnabled;
  chrome.storage.local.set({ focusModeEnabled: extensionSettings.focusModeEnabled });
  
  if (extensionSettings.focusModeEnabled) {
    document.body.style.filter = 'brightness(0.95) contrast(1.1)';
    document.body.style.transition = 'filter 0.3s ease';
    showToaster('🎯 Focus Mode activé', 'success');
  } else {
    document.body.style.filter = 'none';
    showToaster('🎯 Focus Mode désactivé', 'info');
  }
}

// ============================================================================
// BUG FIX #5: Improved Language Detection (Bug #8)
// ============================================================================
function detectLanguage(text) {
  try {
    const minLength = 50; // Minimum 50 chars
    if (text.length < minLength) return 'en'; // Texte trop court
    
    const langPatterns = {
      'fr': /\b(le|la|de|et|un|est|que|pour|avec|dans|les|ce|qui|mon|pas)\b/gi,
      'es': /\b(el|la|de|y|un|es|que|para|con|en|los|este|que|mi|no)\b/gi,
      'de': /\b(der|die|das|und|in|zu|den|von|zu|das|mit|sich|des)\b/gi,
      'it': /\b(il|la|di|e|un|è|che|per|con|in|da|ho|un|questi|lui)\b/gi,
      'pt': /\b(o|a|de|e|um|é|que|para|com|em|do|da|os|este|não)\b/gi,
      'nl': /\b(de|en|van|het|een|in|is|te|dat|die|op|aan|met|zijn)\b/gi,
      'ru': /\b(и|в|я|не|на|он|что|ы|то|с|он)\b/gi,
      'zh': /[\u4E00-\u9FFF]+/g // Caractères chinois
    };

    const detectedScores = {};
    
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      const matches = text.match(pattern) || [];
      detectedScores[lang] = matches.length;
    }

    // Prendre la langue avec le meilleur score (seuil min de 2)
    const best = Object.entries(detectedScores)
      .sort(([, a], [, b]) => b - a)[0];

    if (best && best[1] > 2) {  // Seuil: 2 matches minimum
      return best[0];
    }
    
    return 'en'; // Fallback
  } catch (error) {
    console.error('[AITools] Language detection error:', error);
    return 'en';
  }
}

// ============================================================================
// BUG FIX #6: Extract Text with Word Limit (Bug #7)
// ============================================================================
function extractRelevantPageText(maxWords = 5000) {
  try {
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-body',
      'p'
    ];

    let text = '';
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        text = element.innerText;
        break;
      }
    }

    if (!text) {
      text = document.body.innerText;
    }

    // Nettoyer + limiter à maxWords
    let cleanText = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, maxWords)
      .join(' ');

    return cleanText.substring(0, 15000); // Max 15k chars
  } catch (error) {
    console.error('[AITools] Error extracting text:', error);
    return '';
  }
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

    if (menu && menu.parentNode) { menu.remove(); menu = null; }
    if (!selected) return;

    menu = document.createElement('div');
    menu.id = 'aitools-highlight-menu';
    menu.style.cssText = `
      position: fixed; background: white; border: 1px solid #ddd; border-radius: 8px;
      padding: 8px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 12px;
    `;

    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
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

  // Disappear immediately when selection is cleared (bug fix)
  document.addEventListener('selectionchange', () => {
    const selected = window.getSelection().toString().trim();
    if (!selected && menu && menu.parentNode) { menu.remove(); menu = null; }
  });
}

window.aiToolsAddNote = function (text) {
  chrome.runtime.sendMessage({
    action: 'addNote',
    data: { text, url: window.location.href, title: document.title, timestamp: new Date().toISOString() }
  });
};

// ============================================================================
// SHARED CONTENT EXTRACTION — used by summarizer and translator (bug #9)
// ============================================================================
function extractRelevantPageText(maxLength = 6000) {
  // Strategy 1: semantic main element
  const mainEl = document.querySelector('article, [role="main"], main');
  if (mainEl) return mainEl.innerText.trim().substring(0, maxLength);

  // Strategy 2: filtered paragraphs
  const excluded = new Set(['NAV', 'FOOTER', 'HEADER', 'ASIDE', 'SCRIPT', 'STYLE', 'NOSCRIPT']);
  const paragraphs = Array.from(document.querySelectorAll('p'))
    .filter(el => {
      let p = el.parentElement;
      while (p) {
        if (excluded.has(p.tagName) || p.getAttribute('role') === 'navigation') return false;
        p = p.parentElement;
      }
      return el.innerText.trim().length > 60;
    })
    .map(el => el.innerText.trim())
    .join('\n');

  if (paragraphs.length > 200) return paragraphs.substring(0, maxLength);

  // Fallback
  return document.body.innerText.substring(0, maxLength);
}

// ============================================================================
// GOOGLE SEARCH ENHANCEMENTS
// ============================================================================
function setupGoogleEnhancements() {
  if (!window.location.hostname.includes('google.')) return;

  function hasActiveSearch() {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      return q && q.trim().length > 0;
    } catch { return false; }
  }

  if (!hasActiveSearch()) return;
  if (buttonVisibility.googleButtons === false) return;

  function getGoogleSearchInput() {
    let input = document.querySelector('input[name="q"]');
    if (input && input.offsetParent !== null) return input;

    const form = document.querySelector('form[action*="/search"]');
    if (form) { input = form.querySelector('input[type="text"]'); if (input) return input; }

    const inputs = document.querySelectorAll('input[type="text"]');
    for (let inp of inputs) {
      if (inp.offsetParent !== null && inp.getBoundingClientRect().top < 200) return inp;
    }

    try {
      const q = new URLSearchParams(window.location.search).get('q') || '';
      if (q) return { value: q, fromURL: true };
    } catch {}

    return null;
  }

  let isInjecting = false;

  const injectGoogleButtons = () => {
    if (isInjecting) return;
    if (!hasActiveSearch()) return;
    if (document.getElementById('aitools-google-buttons')) return;

    const searchInput = getGoogleSearchInput();
    if (!searchInput) { setTimeout(injectGoogleButtons, 1000); return; }

    isInjecting = true;

    const container = document.createElement('div');
    container.id = 'aitools-google-buttons';
    container.style.cssText = `
      position: fixed; top: 80px; right: 20px; display: flex; align-items: center;
      gap: 8px; flex-wrap: wrap; background: transparent; z-index: 10000; max-width: 400px;
    `;

    if (!document.getElementById('aitools-google-styles')) {
      const style = document.createElement('style');
      style.id = 'aitools-google-styles';
      style.textContent = `
        .aitools-gb { display:inline-flex;align-items:center;padding:8px 12px;background:transparent;
          color:#5f6368;border:none;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;
          transition:all 0.2s;white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
          pointer-events:auto;user-select:none; }
        .aitools-gb:hover { color:#202124;background:rgba(0,0,0,0.05); }
        .aitools-gb:active { background:rgba(102,126,234,0.1); }
        #aitools-google-buttons { cursor:grab !important; }
        #aitools-google-buttons:active { cursor:grabbing !important; }
      `;
      document.head.appendChild(style);
    }

    chrome.storage.local.get(['googleButtonsVisibility', 'googleButtonsConfig'], (result) => {
      const visibility = result.googleButtonsVisibility || { lucky: true, filters: true, maps: true, chatgpt: true };
      const config = result.googleButtonsConfig || {};

      const currentQuery = getGoogleSearchInput()?.value?.trim() ||
        new URLSearchParams(window.location.search).get('q') || '';

      const buttonDefs = [
        { key: 'lucky', label: '🍀 Chance', action: 'lucky' },
        { key: 'filters', label: '🔍 Filtres', action: 'filters' },
        { key: 'maps', label: '🗺️ Maps', action: 'maps' },
        { key: 'chatgpt', label: '🤖 ChatGPT', action: 'chatgpt' }
      ];

      // Dynamic: YouTube Music if music search (improvement I)
      const musicKeywords = ['music', 'musique', 'chanson', 'song', 'album', 'artist', 'artiste',
        'lyrics', 'paroles', 'titre', 'track', 'remix', 'feat', 'clip', 'discographie'];
      if (musicKeywords.some(kw => currentQuery.toLowerCase().includes(kw))) {
        buttonDefs.push({ key: 'ytmusic', label: '🎵 YT Music', action: 'ytmusic' });
      }

      buttonDefs.forEach((def) => {
        if (def.key !== 'ytmusic' && visibility[def.key] === false) return;

        const customConfig = config[def.key] || {};
        const label = customConfig.label || def.label;
        const action = customConfig.action || def.action;
        const color = customConfig.color || '#5f6368';

        const btn = document.createElement('button');
        btn.className = 'aitools-gb';
        btn.textContent = label; // Bug #15 Fix: Use textContent instead of innerHTML
        btn.type = 'button';
        btn.id = `aitools-gb-${def.key}`;
        btn.style.color = color;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const query = getGoogleSearchInput()?.value?.trim() ||
            new URLSearchParams(window.location.search).get('q') || '';
          if (!query) { alert('⚠️ Entrez une recherche'); return; }

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
  const handleNavigation = debounce(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const c = document.getElementById('aitools-google-buttons');
      if (c) c.remove();
      isInjecting = false;
      if (hasActiveSearch()) setTimeout(injectGoogleButtons, 300);
    } else if (!document.getElementById('aitools-google-buttons') && hasActiveSearch()) {
      setTimeout(injectGoogleButtons, 100);
    }
  }, 300);
  
  // Bug #12 Fix: Use ObserverManager
  ObserverManager.observe(
    'google-nav-observer',
    document.body,
    handleNavigation,
    { childList: true, subtree: false }
  );
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

  closeCookiePopups(); // First attempt immediately
  setTimeout(() => closeCookiePopups(), 1500);

  // Bug #12 + #14 Fix: Use debounce-wrapped callback with ObserverManager
  const debouncedCloseCookies = debounce(() => {
    if (!cookieBlockerPaused) {
      closeCookiePopups();
    }
  }, 300);

  // Use ObserverManager instead of creating new MutationObserver
  ObserverManager.observe(
    'cookie-observer',
    document.body,
    debouncedCloseCookies,
    { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'display']
    }
  );
}

const COOKIE_KEYWORDS = [
  'cookie', 'cookies', 'gdpr', 'consentement', 'consent', 'privacy',
  'vie privée', 'données personnelles', 'personal data', 'accepter', 'accept',
  'politique de confidentialité'
];

function elementHasCookieKeyword(element) {
  const text = element.innerText?.toLowerCase() || '';
  return COOKIE_KEYWORDS.some(kw => text.includes(kw));
}

function closeCookiePopups() {
  const popupSelectors = [
    '[id*="cookie"],[class*="cookie"]',
    '[id*="consent"],[class*="consent"]',
    '[id*="gdpr"],[class*="gdpr"]',
    '[role="dialog"][aria-label*="cookie" i]',
    '[role="dialog"][aria-label*="consent" i]',
    '[id*="onetrust"],[class*="onetrust"]',
    '[id*="cookiepro"],[class*="cookiepro"]',
    '[id*="borlabs"],[class*="borlabs"]',
    '[id*="termly"],[class*="termly"]'
  ];

  document.querySelectorAll(popupSelectors.join(', ')).forEach(popup => {
    if (!isVisible(popup)) return;
    if (popup.offsetHeight < 50) return;
    const text = popup.innerText || '';
    if (text.length < 20) return;
    if (!elementHasCookieKeyword(popup)) return;

    const clicked = tryClickCookieButton(popup);
    if (clicked) {
      cookieObserverPaused = true;
      setTimeout(() => { cookieObserverPaused = false; }, 5000);
    }
  });
}

function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' &&
    style.opacity !== '0' && element.offsetHeight > 0;
}

function tryClickCookieButton(popup) {
  const buttons = popup.querySelectorAll('button, a[role="button"], [role="button"]');

  // Improvement E: try "refuse all" first (better for privacy)
  const refusePatterns = [
    'refuser tout', 'tout refuser', 'reject all', 'refuse all',
    'nécessaires uniquement', 'essential only', 'nur notwendige',
    'solo necessari', 'continuer sans accepter', 'decline all'
  ];
  for (const btn of buttons) {
    const btnText = btn.textContent.toLowerCase().trim();
    for (const pattern of refusePatterns) {
      if (btnText.includes(pattern)) { btn.click(); return true; }
    }
  }

  // Then try "accept"
  const acceptPatterns = [
    'accept all', 'accepter tout', 'tout accepter', "j'accepte", 'agree',
    'allow all', 'autoriser tout', 'confirm', 'ok', 'accept',
    'aceptar', 'alle akzeptieren', 'accetta', 'concordo', 'oui', 'yes'
  ];
  for (const btn of buttons) {
    const btnText = btn.textContent.toLowerCase().trim();
    const btnClass = btn.className.toLowerCase();
    const btnId = btn.id.toLowerCase();

    for (const pattern of acceptPatterns) {
      if (btnText.includes(pattern)) { btn.click(); return true; }
    }
    if (btnClass.includes('accept') || btnClass.includes('agree') ||
      btnId.includes('accept') || btnId.includes('agree')) {
      btn.click(); return true;
    }
  }

  // Fallback: hide
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
  if (hostname.includes('google.') || hostname.includes('facebook.') ||
    hostname.includes('twitter.') || hostname.includes('instagram.') ||
    hostname.includes('youtube.') || hostname.includes('reddit.')) return;

  setTimeout(() => {
    const text = document.body.innerText;
    if (text.length < 500) return;
    const result = detectAIText(text.substring(0, 10000));
    const threshold = extensionSettings.aiDetectorSensitivity || 60;
    if (result.score > threshold) showAIBadge(result);
  }, 3000);
}

// Improvement C: return score + details
function detectAIText(text) {
  const passiveMatches = text.match(/(\bwas\b|\bwere\b|\bbeing\b)/gi) || [];
  const formalMatches = text.match(/(\bthus\b|\btherefore\b|\bmoreover\b|\bfurthermore\b|\bin conclusion\b)/gi) || [];
  const structureMatches = text.match(/(\.\s[A-Z][a-z]{3,})/g) || [];
  const wordCount = Math.max(1, text.split(/\s+/).length);
  const sentenceCount = Math.max(1, text.split('.').length);
  const lineCount = Math.max(1, text.split('\n').length);

  const score = Math.min(100, Math.round(
    (passiveMatches.length / wordCount * 100) * 0.3 +
    (structureMatches.length / sentenceCount * 100) * 0.4 +
    (formalMatches.length / lineCount * 100) * 0.3
  ));

  return {
    score,
    details: {
      passif: passiveMatches.length,
      formel: formalMatches.length,
      structure: structureMatches.length
    }
  };
}

function showAIBadge(result) {
  if (!elementVisibility.aiBadge) return;
  if (document.getElementById('aitools-ai-badge')) return;

  const { score, details } = result;

  const badge = document.createElement('div');
  badge.id = 'aitools-ai-badge';
  badge.style.cssText = `
    position: fixed; top: 80px; right: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    z-index: 9999; box-shadow: 0 4px 16px rgba(255,107,107,0.3); cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex; align-items: center; justify-content: space-between; gap: 8px; user-select: none;
  `;

  const scoreSpan = document.createElement('span');
  scoreSpan.textContent = '⚠️ IA: ' + score + '%';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;
    border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elementVisibility.aiBadge = false;
    setStorageSafe('aitools-visibility', elementVisibility);
    badge.remove();
  });

  badge.appendChild(scoreSpan);
  badge.appendChild(closeBtn);

  // Improvement C: click opens detail tooltip
  badge.addEventListener('click', (e) => {
    if (e.target.closest('.aitools-close-btn')) return;
    const existing = document.getElementById('aitools-ai-detail');
    if (existing) { existing.remove(); return; }

    const detail = document.createElement('div');
    detail.id = 'aitools-ai-detail';
    detail.style.cssText = `
      position: fixed; top: 128px; right: 20px; background: white; color: #333;
      border: 1px solid #eee; border-radius: 8px; padding: 12px; font-size: 11px;
      z-index: 10000; box-shadow: 0 4px 16px rgba(0,0,0,0.12); min-width: 200px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    // Bug #9 Fix: Use createElement instead of innerHTML
    const title = document.createElement('strong');
    title.style.cssText = 'display:block;margin-bottom:8px;color:#555;';
    title.textContent = 'Indicateurs détectés :';
    detail.appendChild(title);
    
    const passifDiv = document.createElement('div');
    passifDiv.style.cssText = 'margin-bottom:4px;';
    passifDiv.textContent = '🔄 Tournures passives : ' + details.passif;
    detail.appendChild(passifDiv);
    
    const formelDiv = document.createElement('div');
    formelDiv.style.cssText = 'margin-bottom:4px;';
    formelDiv.textContent = '📝 Connecteurs formels : ' + details.formel;
    detail.appendChild(formelDiv);
    
    const structDiv = document.createElement('div');
    structDiv.style.cssText = 'margin-bottom:4px;';
    structDiv.textContent = '📐 Structure répétitive : ' + details.structure;
    detail.appendChild(structDiv);
    
    const scoreDiv = document.createElement('div');
    scoreDiv.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #eee;color:#888;font-size:10px;';
    const scoreText = score > 70 ? 'Très probablement IA' : score > 40 ? 'Possiblement IA' : 'Probablement humain';
    scoreDiv.textContent = 'Score global : ' + score + '% — ' + scoreText;
    detail.appendChild(scoreDiv);
    
    document.body.appendChild(detail);

    // Close on outside click
    setTimeout(() => {
      const closeDetail = (ev) => {
        if (!detail.contains(ev.target) && !badge.contains(ev.target)) {
          detail.remove();
          document.removeEventListener('click', closeDetail);
        }
      };
      document.addEventListener('click', closeDetail);
    }, 100);
  });

  document.body.appendChild(badge);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-ai-badge', badge, { width: 160, height: 40, priority: 2, draggable: true });
  }
  makeDraggable(badge, 'aitools-ai-badge-pos');
  setTimeout(() => { if (badge.isConnected) badge.style.opacity = '0.75'; }, 3000);
}

// ============================================================================
// SUMMARIZER
// ============================================================================

// Bug #2 fix: proper content extraction strategy
function summarizePage() {
  // Strategy 1: Wikipedia specific selector
  const wikiContent = document.getElementById('mw-content-text');
  if (wikiContent) {
    const text = extractCleanText(wikiContent);
    if (text.length > 500) return text.substring(0, 8000);
  }

  // Strategy 2: semantic main element (article, main, [role="main"])
  const semantic = Array.from(document.querySelectorAll('article, [role="main"], main'))
    .map(el => extractCleanText(el))
    .filter(t => t.length > 200);
  if (semantic.length > 0) return semantic[0].substring(0, 8000);

  // Strategy 3: find largest content area
  const candidates = Array.from(document.querySelectorAll('div, section'))
    .filter(el => {
      const text = extractCleanText(el);
      return text.length > 500 && text.length < 50000;
    })
    .map(el => ({
      element: el,
      text: extractCleanText(el),
      score: calculateContentScore(el)
    }))
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    return candidates[0].text.substring(0, 8000);
  }

  // Strategy 4: extract all paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p'))
    .map(el => el.innerText.trim())
    .filter(t => t.length > 50 && !isMetaContent(t))
    .slice(0, 50)
    .join('\n');

  if (paragraphs.length > 200) return paragraphs;

  // Last resort
  return document.body.innerText.substring(0, 6000);
}

// Helper: Extract clean text by removing unwanted elements
function extractCleanText(element) {
  const clone = element.cloneNode(true);
  
  // Remove unwanted elements
  const unwanted = clone.querySelectorAll('nav, footer, header, aside, script, style, .toc, .navbox, .infobox, .reference, [class*="sidebar"], [class*="menu"]');
  unwanted.forEach(el => el.remove());

  // Get text and clean it
  let text = clone.innerText || clone.textContent || '';
  text = text.trim()
    .split('\n')
    .filter(line => {
      const clean = line.trim();
      return clean.length > 10 && !isMetaContent(clean);
    })
    .join('\n');

  return text;
}

// Helper: Check if text is metadata (coordinates, infobox content, links, etc.)
function isMetaContent(text) {
  const metaPatterns = [
    /^\d+°\s*\d+[′']\s*[NSEW]/i, // Coordinates
    /^\[?\d+\]$/,  // Reference numbers
    /^(?:Article|Discuss|Edit|View|History|Tools|Settings|Dark|Light|Font|Width|Color|UTC|UTC\s*[+-])/i,
    /^(?:↑|→|←|↓|\*|·|\-){1,3}\s*\[?https?:/ // Links/arrows
  ];
  
  return metaPatterns.some(pattern => pattern.test(text));
}

// Helper: Score element based on content quality
function calculateContentScore(element) {
  let score = 0;
  
  // Prefer elements with many paragraphs
  const paragraphs = element.querySelectorAll('p');
  score += paragraphs.length * 10;
  
  // Prefer elements with less navigation/sidebar content
  const unwanted = element.querySelectorAll('nav, aside, .sidebar, .navbox, .toc');
  score -= unwanted.length * 50;
  
  // Penalize if too close to nav/footer
  const parent = element.parentElement;
  if (parent && (parent.matches('nav, footer, aside, .sidebar'))) {
    score -= 1000;
  }
  
  return score;
}

// Bug #2 fix: replace char-by-char loop with regex split
function betterSummarize(text, length = 35) {
  if (!text || text.length < 100) return text;

  // BUG FIX #7: Limiter le texte d'entrée à 5000 mots max
  const maxWords = 5000;
  const words = text.split(/\s+/).slice(0, maxWords);
  const limitedText = words.join(' ');

  const cleanText = limitedText.replace(/\s+/g, ' ').trim();

  // Use regex split — 10x faster than char loop
  let sentences = (cleanText.match(/[^.!?…]+[.!?…]+(?:\s|$)/g) || [cleanText])
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.split(/\s+/).length >= 4);

  if (sentences.length === 0) return cleanText.substring(0, 300) + '...';
  if (sentences.length <= 2) return sentences.join(' ');

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'be', 'is', 'are', 'was', 'were', 'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une',
    'en', 'à', 'pour', 'que', 'qui'
  ]);

  const allWords = cleanText.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const wordFreq = {};
  allWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

  const scored = sentences.map((sentence, idx) => {
    let score = 1;
    const words = sentence.toLowerCase().split(/\s+/);
    if (idx === 0) score += 5;
    if (idx === sentences.length - 1) score += 4;
    if (idx === sentences.length - 2) score += 2;
    words.forEach(w => { if (wordFreq[w] > 1 && !stopWords.has(w)) score += Math.log(wordFreq[w] + 1); });
    if (/\d+%/.test(sentence)) score += 6;
    else if (/\d+/.test(sentence)) score += 2;
    const wc = words.length;
    if (wc >= 15 && wc <= 50) score += 4;
    return { sentence, score, index: idx };
  });

  const pct = Math.max(0.15, Math.min(0.8, (length || extensionSettings.summarizerLength || 35) / 100));
  const keepCount = Math.max(2, Math.ceil(sentences.length * pct));

  const selectedSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  // Format with structure and sections
  return formatSummary(selectedSentences.join(' '));
}

// Create structured summary with sections and numbering
function formatSummary(rawSummary) {
  if (!rawSummary || rawSummary.length < 50) return rawSummary;

  // Split into sentences
  const sentences = rawSummary.match(/[^.!?]+[.!?]+/g) || [rawSummary];
  if (sentences.length < 3) return rawSummary;

  // Group sentences into logical sections (max 3-4 sentences per section)
  const sections = [];
  let currentSection = [];
  let sectionCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    currentSection.push(sentence);

    // Create new section every 3-4 sentences or at end
    if (currentSection.length >= 3 || i === sentences.length - 1) {
      sectionCount++;
      const sectionTitle = generateSectionTitle(currentSection, sectionCount);
      sections.push({
        title: sectionTitle,
        content: currentSection.join(' ').trim()
      });
      currentSection = [];
    }
  }

  // Format with numbering and clear structure
  let formatted = '';
  sections.forEach((section, idx) => {
    formatted += `${idx + 1}. ${section.title}\n`;
    formatted += `   ${section.content}\n\n`;
  });

  return formatted.trim();
}

// Generate contextual section titles based on content
function generateSectionTitle(sentences, sectionNumber) {
  if (!sentences || sentences.length === 0) return `Section ${sectionNumber}`;

  const firstSentence = sentences[0].toLowerCase();
  
  // Detect common patterns
  if (/^(la|le|le) france|^france|^la républ|^un état|^un pays/i.test(firstSentence)) {
    return ['Définition', 'Présentation générale', 'Mise en contexte', 'Vue d\'ensemble'][sectionNumber % 4];
  }
  if (/histoire|passé|ancien|avant|siècle|période/i.test(firstSentence)) {
    return ['Historique', 'Contexte historique', 'Évolution', 'Antécédents'][sectionNumber % 4];
  }
  if (/territoire|superficie|géogr|zone|région|climat/i.test(firstSentence)) {
    return ['Géographie', 'Localisation', 'Caractéristiques géographiques', 'Environnement'][sectionNumber % 4];
  }
  if (/économ|pib|industri|commerce|ressourc|produit/i.test(firstSentence)) {
    return ['Économie', 'Situation économique', 'Ressources', 'Développement'][sectionNumber % 4];
  }
  if (/populat|habitant|démo|person|citoyen|socié/i.test(firstSentence)) {
    return ['Population', 'Démographie', 'Sociologie', 'Statistiques'][sectionNumber % 4];
  }
  if (/gouvern|régime|politiq|État|instit|admin/i.test(firstSentence)) {
    return ['Gouvernance', 'Système politique', 'Administration', 'Organisation institutionnelle'][sectionNumber % 4];
  }
  if (/cultur|art|traditi|langue|littér|science/i.test(firstSentence)) {
    return ['Culture', 'Arts et traditions', 'Patrimoine', 'Vie culturelle'][sectionNumber % 4];
  }
  if (/membre|organis|inter|union|traité|accord/i.test(firstSentence)) {
    return ['Relations internationales', 'Engagements', 'Organisations', 'Partenariats'][sectionNumber % 4];
  }

  // Fallback: extract first few significant words
  const words = firstSentence.split(/\s+/).slice(0, 4).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ============================================================================
// IMPROVED SUMMARIZER — Using Gemini Nano for better results
// ============================================================================
async function generateSummaryWithAI(text, length = 35) {
  // Vérifier que AIService est disponible
  if (!window.aiService) {
    console.warn('[Summarizer] AIService not available, using fallback');
    return betterSummarize(text, length);
  }

  try {
    // Limiter le texte à 3000 caractères pour l'API
    const textForAI = text.substring(0, 3000);
    const result = await window.aiService.summarize(textForAI, length);
    
    // Result is either a string or null
    if (!result) {
      console.warn('[Summarizer] AI returned null, using fallback');
      return betterSummarize(text, length);
    }
    
    // Return formatted result
    return formatSummary(result);
  } catch (err) {
    console.warn('[Summarizer] AI error, using fallback:', err.message);
    return betterSummarize(text, length);
  }
}

// Sidebar panel for summary (with formatting, titles, and copy button)
function showSummaryPanel(summary) {
  if (!summary || summary.trim().length === 0) {
    alert('❌ Impossible de générer un résumé pour cette page');
    return;
  }

  const existing = document.getElementById('aitools-summary-panel');
  if (existing) existing.remove();

  // Detect small screen
  const isSmallScreen = window.innerWidth < 768;

  // Container with better sizing
  const toast = document.createElement('div');
  toast.id = 'aitools-summary-panel';
  
  const width = isSmallScreen ? 'calc(100vw - 30px)' : '420px';
  const bottom = isSmallScreen ? '10px' : '20px';
  const right = isSmallScreen ? '15px' : '20px';
  const maxHeight = isSmallScreen ? '60vh' : '500px';
  const borderRadius = isSmallScreen ? '12px' : '10px';
  
  toast.style.cssText = `
    position: fixed;
    bottom: ${bottom};
    right: ${right};
    width: ${width};
    max-width: 500px;
    background: white;
    border-radius: ${borderRadius};
    padding: 0;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    max-height: ${maxHeight};
    animation: aitools-toast-slide 0.3s ease forwards;
  `;

  // Header with title and buttons
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: ${borderRadius} ${borderRadius} 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  `;

  const title = document.createElement('h3');
  title.style.cssText = 'margin: 0; font-size: 15px; font-weight: 600; flex-grow: 1;';
  title.textContent = '📋 Résumé';
  header.appendChild(title);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = isSmallScreen ? '📋' : '📋 Copier';
  copyBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 6px ${isSmallScreen ? '8px' : '12px'};
    border-radius: 5px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
  `;
  copyBtn.addEventListener('mouseover', () => { copyBtn.style.background = 'rgba(255,255,255,0.3)'; });
  copyBtn.addEventListener('mouseout', () => { copyBtn.style.background = 'rgba(255,255,255,0.2)'; });
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(summary);
    const origText = isSmallScreen ? '📋' : '📋 Copier';
    copyBtn.textContent = '✅';
    setTimeout(() => { copyBtn.textContent = origText; }, 2000);
  });
  header.appendChild(copyBtn);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  `;
  closeBtn.addEventListener('mouseover', () => { closeBtn.style.background = 'rgba(255,255,255,0.3)'; });
  closeBtn.addEventListener('mouseout', () => { closeBtn.style.background = 'rgba(255,255,255,0.2)'; });
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'aitools-toast-slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });
  header.appendChild(closeBtn);

  toast.appendChild(header);

  // Content area with scrolling
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: ${isSmallScreen ? '12px' : '16px'};
    font-size: ${isSmallScreen ? '12px' : '13px'};
    line-height: 1.7;
    color: #333;
  `;

  // Parse and format the summary
  const sections = parseSummaryIntoSections(summary);
  
  sections.forEach((section, idx) => {
    // Section title
    const sectionTitle = document.createElement('h4');
    sectionTitle.style.cssText = `
      margin: ${idx === 0 ? '0 0 8px 0' : '14px 0 8px 0'};
      font-size: ${isSmallScreen ? '11px' : '13px'};
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    sectionTitle.textContent = section.title;
    content.appendChild(sectionTitle);

    // Section content
    const sectionContent = document.createElement('p');
    sectionContent.style.cssText = `
      margin: 0 0 12px 0;
      padding-left: 12px;
      border-left: 3px solid #667eea;
      font-size: ${isSmallScreen ? '11px' : '12.5px'};
      line-height: 1.6;
      color: #555;
    `;
    sectionContent.textContent = section.content;
    content.appendChild(sectionContent);
  });

  toast.appendChild(content);

  // Add animation if not exists
  if (!document.getElementById('aitools-toast-animations')) {
    const style = document.createElement('style');
    style.id = 'aitools-toast-animations';
    style.textContent = `
      @keyframes aitools-toast-slide {
        from { 
          transform: translateX(450px); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0); 
          opacity: 1; 
        }
      }
      @keyframes aitools-toast-slide-out {
        from { 
          transform: translateX(0); 
          opacity: 1; 
        }
        to { 
          transform: translateX(450px); 
          opacity: 0; 
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-hide after 15 seconds
  setTimeout(() => {
    if (toast.isConnected) {
      toast.style.animation = 'aitools-toast-slide-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 15000);
}

// Parse summary sections (format: "1. Title\n   Content\n\n2. Title...")
function parseSummaryIntoSections(summary) {
  const sections = [];
  
  // Match pattern: "N. Title\n   Content"
  const sectionRegex = /(\d+)\.\s+(.+?)\n\s+(.+?)(?=\n\d+\.|$)/gs;
  let match;

  while ((match = sectionRegex.exec(summary)) !== null) {
    const num = match[1];
    const title = match[2].trim();
    const content = match[3].trim().replace(/\n\s+/g, ' ');
    
    sections.push({
      num,
      title,
      content
    });
  }

  // If no sections found, treat whole summary as one section
  if (sections.length === 0) {
    return [{
      num: '1',
      title: 'Résumé',
      content: summary.trim()
    }];
  }

  return sections;
}

// ============================================================================
// SIMPLE TRANSLATOR — Direct translation display
// ============================================================================
async function generateTranslationWithAI(text, sourceLang, targetLang) {
  if (!window.aiService) return null;

  try {
    const textForAI = text.substring(0, 2000);
    const result = await window.aiService.translate(textForAI, targetLang);
    
    // Result is either a string or null
    return result || null;
  } catch (err) {
    console.error('Translation error:', err);
    return null;
  }
}

// Show translation error message
function showTranslationError(sourceLang, targetLang) {
  const langNames = {
    fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand',
    it: 'Italien', pt: 'Portugais', ja: 'Japonais', zh: 'Chinois'
  };

  // Remove existing
  const existing = document.getElementById('aitools-translation-error');
  if (existing) existing.remove();

  // Create error modal
  const error = document.createElement('div');
  error.id = 'aitools-translation-error';
  error.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 99999;
    max-width: 500px;
    width: 90%;
    overflow: hidden;
    animation: aitools-slide-up 0.3s ease;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
    padding: 20px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const title = document.createElement('div');
  title.style.cssText = 'font-weight: 600; font-size: 16px;';
  title.innerHTML = '⚠️ Traduction indisponible';
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
  `;
  closeBtn.addEventListener('click', () => error.remove());
  header.appendChild(closeBtn);
  error.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'padding: 20px; color: #333; line-height: 1.6;';
  body.innerHTML = `
    <p style="margin: 0 0 15px;">L'API Gemini Nano (Prompt API) n'est pas disponible sur votre navigateur.</p>
    <p style="margin: 0 0 15px; font-size: 13px; color: #666;">
      <strong>Pour l'activer:</strong>
    </p>
    <ol style="margin: 0 0 15px; padding-left: 20px; font-size: 13px; color: #666;">
      <li>Allez à <code style="background: #f3f4f6; padding: 2px 4px;">chrome://flags</code></li>
      <li>Recherchez "Prompt API for Gemini Nano"</li>
      <li>Mettez à "Enabled"</li>
      <li>Redémarrez Chrome</li>
    </ol>
    <p style="margin: 0; font-size: 12px; color: #999;">
      Note: Disponible sur Chrome 129+ et nécessite un accès à Gemini.
    </p>
  `;
  error.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 12px 20px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
  `;

  const okBtn = document.createElement('button');
  okBtn.textContent = 'Fermer';
  okBtn.style.cssText = `
    padding: 8px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  `;
  okBtn.addEventListener('click', () => error.remove());
  footer.appendChild(okBtn);
  error.appendChild(footer);

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 99998;
  `;
  backdrop.addEventListener('click', () => {
    error.remove();
    backdrop.remove();
  });

  document.body.appendChild(backdrop);
  document.body.appendChild(error);

  // Auto-close after 10 seconds
  setTimeout(() => {
    if (document.getElementById('aitools-translation-error')) {
      error.remove();
      backdrop.remove();
    }
  }, 10000);
}

// Simple popup-like translation display
function showTranslationPanel(original, translated, sourceLang, targetLang) {
  const langNames = {
    fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand',
    it: 'Italien', pt: 'Portugais', ja: 'Japonais', zh: 'Chinois'
  };

  // Remove existing
  const existing = document.getElementById('aitools-translation-modal');
  if (existing) existing.remove();
  const backdrop = document.getElementById('aitools-translation-backdrop');
  if (backdrop) backdrop.remove();

  // Create backdrop
  const bgBackdrop = document.createElement('div');
  bgBackdrop.id = 'aitools-translation-backdrop';
  bgBackdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 99998;
    animation: aitools-fade-in 0.2s ease;
  `;
  bgBackdrop.addEventListener('click', closeTranslation);

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'aitools-translation-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 900px;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: aitools-slide-up 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  // Header with gradient
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  `;

  const headerTitle = document.createElement('div');
  headerTitle.style.cssText = 'font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px;';
  headerTitle.innerHTML = `🌐 <span>${langNames[targetLang] || targetLang}</span>`;
  header.appendChild(headerTitle);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
  closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
  closeBtn.addEventListener('click', closeTranslation);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Content area (two columns on desktop, one on mobile)
  const isSmallScreen = window.innerWidth < 768;
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: ${isSmallScreen ? '1fr' : '1fr 1fr'};
    gap: 0;
    min-height: 300px;
  `;

  // Original text column
  const originalCol = document.createElement('div');
  originalCol.style.cssText = `
    padding: ${isSmallScreen ? '16px' : '20px'};
    border-right: ${isSmallScreen ? 'none' : '1px solid #e5e7eb'};
    border-bottom: ${isSmallScreen ? '1px solid #e5e7eb' : 'none'};
    overflow-y: auto;
  `;
  const originalLabel = document.createElement('div');
  originalLabel.style.cssText = `font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 12px;`;
  originalLabel.textContent = '📄 Texte original';
  originalCol.appendChild(originalLabel);
  
  const originalText = document.createElement('div');
  originalText.style.cssText = `color: #333; line-height: 1.7; font-size: ${isSmallScreen ? '13px' : '14px'}; white-space: pre-wrap; word-break: break-word;`;
  originalText.textContent = original;
  originalCol.appendChild(originalText);
  contentWrapper.appendChild(originalCol);

  // Translated text column
  const translatedCol = document.createElement('div');
  translatedCol.style.cssText = `padding: ${isSmallScreen ? '16px' : '20px'}; overflow-y: auto;`;
  const translatedLabel = document.createElement('div');
  translatedLabel.style.cssText = `font-size: 11px; font-weight: 600; color: #667eea; text-transform: uppercase; margin-bottom: 12px;`;
  translatedLabel.textContent = '✨ Traduction';
  translatedCol.appendChild(translatedLabel);
  
  const translatedText = document.createElement('div');
  translatedText.style.cssText = `color: #333; line-height: 1.7; font-size: ${isSmallScreen ? '13px' : '14px'}; white-space: pre-wrap; word-break: break-word;`;
  translatedText.textContent = translated;
  translatedCol.appendChild(translatedText);
  contentWrapper.appendChild(translatedCol);

  modal.appendChild(contentWrapper);

  // Footer with buttons
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 12px ${isSmallScreen ? '12px' : '20px'};
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: ${isSmallScreen ? '8px' : '10px'};
    justify-content: ${isSmallScreen ? 'stretch' : 'flex-end'};
    flex-wrap: wrap;
  `;

  const copyBtn = document.createElement('button');
  copyBtn.innerHTML = isSmallScreen ? '📋' : '📋 Copier traduction';
  copyBtn.style.cssText = `
    padding: 10px ${isSmallScreen ? '10px' : '16px'};
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s;
    flex: ${isSmallScreen ? '1' : 'auto'};
    white-space: nowrap;
  `;
  copyBtn.onmouseover = () => copyBtn.style.background = '#059669';
  copyBtn.onmouseout = () => copyBtn.style.background = '#10b981';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(translated).then(() => {
      const origText = isSmallScreen ? '📋' : '📋 Copier traduction';
      copyBtn.innerHTML = '✅';
      copyBtn.style.background = '#34d399';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copier traduction';
        copyBtn.style.background = '#10b981';
      }, 2000);
    });
  });
  footer.appendChild(copyBtn);

  const closeFooterBtn = document.createElement('button');
  closeFooterBtn.textContent = 'Fermer';
  closeFooterBtn.style.cssText = `
    padding: 10px 16px;
    background: #e5e7eb;
    color: #333;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s;
  `;
  closeFooterBtn.onmouseover = () => closeFooterBtn.style.background = '#d1d5db';
  closeFooterBtn.onmouseout = () => closeFooterBtn.style.background = '#e5e7eb';
  closeFooterBtn.addEventListener('click', closeTranslation);
  footer.appendChild(closeFooterBtn);

  modal.appendChild(footer);

  // Add animations if not present
  if (!document.getElementById('aitools-translation-styles')) {
    const style = document.createElement('style');
    style.id = 'aitools-translation-styles';
    style.textContent = `
      @keyframes aitools-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes aitools-slide-up {
        from { 
          transform: translate(-50%, -40%);
          opacity: 0;
        }
        to { 
          transform: translate(-50%, -50%);
          opacity: 1;
        }
      }
      @keyframes aitools-slide-down {
        from { 
          transform: translate(-50%, -50%);
          opacity: 1;
        }
        to { 
          transform: translate(-50%, -40%);
          opacity: 0;
        }
      }
      #aitools-translation-modal {
        scrollbar-width: thin;
        scrollbar-color: #d1d5db #f3f4f6;
      }
      #aitools-translation-modal::-webkit-scrollbar {
        width: 8px;
      }
      #aitools-translation-modal::-webkit-scrollbar-track {
        background: #f3f4f6;
      }
      #aitools-translation-modal::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }
      #aitools-translation-modal::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;
    document.head.appendChild(style);
  }

  function closeTranslation() {
    modal.style.animation = 'aitools-slide-down 0.2s ease forwards';
    bgBackdrop.style.animation = 'aitools-fade-in 0.2s ease reverse forwards';
    setTimeout(() => {
      modal.remove();
      bgBackdrop.remove();
    }, 200);
  }

  // Show panels
  document.body.appendChild(bgBackdrop);
  document.body.appendChild(modal);

  // Auto-close after 30 seconds
  setTimeout(() => {
    if (document.getElementById('aitools-translation-modal')) closeTranslation();
  }, 30000);
}

// Bug #6 fix: subtree:false + throttle to prevent mutation loop
let summarizerObserverActive = false;

function initSummarizer() {
  if (buttonVisibility.summarizerButton === false) return;
  if (window.location.hostname.includes('google.')) return;
  if (!extensionSettings.summarizerEnabled) return;

  checkAndShowSummarizerButton(); // Check immediately
  setTimeout(() => checkAndShowSummarizerButton(), 1500);

  // Bug #12 + #14 Fix: Use debounced callback with ObserverManager
  const debouncedCheck = debounce(() => {
    if (!summarizerObserverActive) {
      summarizerObserverActive = true;
      checkAndShowSummarizerButton();
      setTimeout(() => {
        summarizerObserverActive = false;
      }, 800);
    }
  }, 500);

  // Use ObserverManager instead of creating new MutationObserver
  ObserverManager.observe(
    'summarizer-observer',
    document.body,
    debouncedCheck,
    { childList: true, subtree: false }
  );
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
    position: fixed; top: 20px; right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; border: none; padding: 10px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 600; cursor: grab; z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex; align-items: center; gap: 8px; user-select: none;
    transition: all 0.3s ease; animation: aitools-slide-in 0.4s ease;
    hover: { transform: translateY(-2px), box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3) }
  `;

  const textSpan = document.createElement('span');
  textSpan.textContent = '✂️ Résumer';
  textSpan.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;
    border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s;`;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elementVisibility.summarizerBtn = false;
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
    btn.style.animation = 'aitools-slide-out 0.3s ease';
    setTimeout(() => { btn.remove(); ButtonManager.removeButton('summarizer'); }, 300);
  });
  
  closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(255,255,255,0.5)');
  closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'rgba(255,255,255,0.3)');

  btn.appendChild(textSpan);
  btn.appendChild(closeBtn);

  btn.addEventListener('click', async (e) => {
    if (!e.target.closest('.aitools-close-btn') && !e.target.closest('.aitools-close-btn')) {
      textSpan.textContent = '⏳ Résumé...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      
      const rawText = summarizePage();
      const summary = await generateSummaryWithAI(rawText, extensionSettings.summarizerLength || 35);
      
      showSummaryPanel(summary);
      textSpan.textContent = '✂️ Résumer';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
  
  btn.addEventListener('mouseover', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.3)';
  });
  
  btn.addEventListener('mouseout', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  document.body.appendChild(btn);
  ButtonManager.registerButton('summarizer', btn);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-summarizer-btn', btn, { width: 140, height: 40, priority: 2, draggable: true });
  }
  makeDraggable(btn, 'aitools-summarize-btn-pos');
}

// Improvement A: copy button in summary modal
function showSummaryModal(summary) {
  const existing = document.getElementById('aitools-summary-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'aitools-summary-overlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;`;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;
    border-radius:12px;max-width:600px;width:90%;max-height:70vh;overflow-y:auto;z-index:10001;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  `;

  const titleEl = document.createElement('h3');
  titleEl.style.cssText = 'margin-top:0;color:#333;';
  titleEl.textContent = '📋 Résumé de la page';

  const textEl = document.createElement('p');
  textEl.style.cssText = 'line-height:1.8;color:#555;font-size:13px;';
  textEl.textContent = summary; // Bug #9 Fix: textContent instead of innerHTML with replace
  // If line breaks needed, split and insert br elements instead:
  // textEl.innerHTML = summary.replace(/\n/g, '<br>') replaced with:
  const summaryLines = summary.split('\n');
  textEl.textContent = '';
  summaryLines.forEach((line, i) => {
    if (i > 0) {
      const br = document.createElement('br');
      textEl.appendChild(br);
    }
    const textNode = document.createTextNode(line);
    textEl.appendChild(textNode);
  });

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;margin-top:16px;';

  const copyBtn = document.createElement('button');
  copyBtn.style.cssText = 'flex:1;background:#10b981;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
  copyBtn.textContent = '📋 Copier';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.textContent = '✅ Copié !';
      setTimeout(() => { copyBtn.textContent = '📋 Copier'; }, 2000);
    });
  });

  const closeBtn = document.createElement('button');
  closeBtn.id = 'aitools-close-summary';
  closeBtn.style.cssText = 'flex:1;background:#667eea;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); overlay.remove(); });

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(closeBtn);
  modal.appendChild(titleEl);
  modal.appendChild(textEl);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================================
// AUTO TRANSLATOR
// ============================================================================

// Bug #8 fix: lower threshold, count occurrences for better accuracy
function detectLanguageOfText(text) {
  if (!text || text.length < 5) return null;

  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) {
    const lc = htmlLang.substring(0, 2).toLowerCase();
    if (['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh'].includes(lc)) return lc;
  }

  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/g.test(text)) return 'zh';

  const tc = text.substring(0, 5000);
  const countMatches = (str, regex) => (str.match(regex) || []).length;

  const scores = {
    'fr': (/(ç|œ|é|è|ê|ë|à|ù|û)/i.test(tc) ? 4 : 0) +
      Math.min(3, countMatches(tc, /\b(le|la|les|des|est|sont|avec|pour|dans|que|une|pas|très|aussi)\b/gi)),
    'es': (/(á|é|í|ó|ú|ñ|¡|¿)/i.test(tc) ? 4 : 0) +
      Math.min(3, countMatches(tc, /\b(el|la|los|que|una|está|son|para|como|pero|del)\b/gi)),
    'de': (/(ä|ö|ü|ß)/i.test(tc) ? 4 : 0) +
      Math.min(3, countMatches(tc, /\b(der|die|das|und|ist|sind|mit|nicht|auch|für)\b/gi)),
    'it': Math.min(5, countMatches(tc, /\b(il|lo|la|che|è|sono|una|per|con|del|della)\b/gi)),
    'pt': (/(ã|õ|ç)/i.test(tc) ? 4 : 0) +
      Math.min(3, countMatches(tc, /\b(o|a|os|que|é|uma|com|por|para|do|da)\b/gi))
  };

  const max = Math.max(...Object.values(scores));
  // Bug #8 fix: lowered threshold from > 3 to > 1
  if (max > 1) return Object.keys(scores).find(l => scores[l] === max);
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
  btn.style.cssText = `
    position: fixed; top: 70px; right: 20px;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white; border: none; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: grab; z-index: 9998; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex; align-items: center; gap: 8px; user-select: none;
    transition: all 0.3s ease; animation: aitools-slide-in 0.4s ease 0.1s both;
  `;

  const textSpan = document.createElement('span');
  textSpan.textContent = '🌐 Traduire';
  textSpan.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;
    border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s;`;
  closeBtn.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    btn.style.animation = 'aitools-slide-out 0.3s ease';
    setTimeout(() => { btn.remove(); ButtonManager.removeButton('translator'); }, 300);
  });
  
  closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(255,255,255,0.5)');
  closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'rgba(255,255,255,0.3)');

  btn.appendChild(textSpan);
  btn.appendChild(closeBtn);

  btn.addEventListener('click', async (e) => {
    if (!e.target.closest('.aitools-close-btn')) {
      textSpan.textContent = '⏳ Traduction...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      
      const relevantText = extractRelevantPageText(3000);
      const translated = await generateTranslationWithAI(relevantText, sourceLang, targetLang);
      
      if (translated && translated.trim().length > 0) {
        console.log('[Translator] ✅ Translation successful, showing panel');
        showTranslationPanel(relevantText.substring(0, 2000), translated, sourceLang, targetLang);
      } else {
        console.warn('[Translator] ⚠️ Translation failed or empty, showing error');
        showTranslationError(sourceLang, targetLang);
      }
      
      textSpan.textContent = '🌐 Traduire';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
  
  btn.addEventListener('mouseover', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.3)';
  });
  
  btn.addEventListener('mouseout', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  document.body.appendChild(btn);
  ButtonManager.registerButton('translator', btn);

  if (window.layoutManager) {
    window.layoutManager.registerElement('aitools-translator-btn', btn, { width: 130, height: 40, priority: 3, draggable: true });
  }
  makeDraggable(btn, 'aitools-translator-btn-pos');
}

// Bug #3 fix: separate fullText display from API truncated text
function translateAndShowModal(fullText, sourceLang, targetLang) {
  const btn = document.getElementById('aitools-translator-btn');
  const spanEl = btn?.querySelector('span');
  if (spanEl) spanEl.textContent = '⏳ Traduction...';
  if (btn) btn.disabled = true;

  // Only send 500 chars to API, but keep fullText for display
  const textForAPI = fullText.substring(0, 500);

  chrome.runtime.sendMessage(
    { action: 'translateText', text: textForAPI, sourceLang, targetLang },
    (response) => {
      if (spanEl) spanEl.textContent = '🌐 Traduire';
      if (btn) btn.disabled = false;

      if (response && response.success) {
        // Bug #3 fix: display up to 2000 chars of original, not the API fragment
        showTranslationModal(fullText.substring(0, 2000), response.text, sourceLang, targetLang);
      } else {
        alert('❌ Erreur lors de la traduction. Réessayez ou vérifiez votre connexion.');
      }
    }
  );
}

function showTranslationModal(original, translated, sourceLang, targetLang) {
  const langNames = {
    fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand',
    it: 'Italien', pt: 'Portugais', ja: 'Japonais', zh: 'Chinois'
  };

  const existing = document.querySelector('[id^="aitools-translation-overlay"]');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'aitools-translation-overlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;`;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;
    border-radius:12px;max-width:700px;width:92%;max-height:80vh;overflow-y:auto;z-index:10001;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  `;

  // Bug #9 Fix: Use createElement instead of innerHTML
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;';
  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin:0;color:#333;';
  h3.textContent = '🌐 Traduction';
  const closeTr = document.createElement('button');
  closeTr.id = 'aitools-close-tr';
  closeTr.style.cssText = 'background:none;border:none;font-size:20px;cursor:pointer;color:#999;';
  closeTr.textContent = '✕';
  headerDiv.appendChild(h3);
  headerDiv.appendChild(closeTr);
  modal.appendChild(headerDiv);

  const gridDiv = document.createElement('div');
  gridDiv.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
  
  // Original text column
  const origCol = document.createElement('div');
  const origLabel = document.createElement('p');
  origLabel.style.cssText = 'margin:0 0 8px;font-weight:600;font-size:11px;color:#666;';
  origLabel.textContent = '📄 ' + (langNames[sourceLang] || sourceLang);
  const origContent = document.createElement('div');
  origContent.style.cssText = 'background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px;line-height:1.6;color:#555;max-height:250px;overflow-y:auto;';
  const origText = original.split('\n');
  origText.forEach((line, i) => {
    if (i > 0) origContent.appendChild(document.createElement('br'));
    origContent.appendChild(document.createTextNode(line));
  });
  origCol.appendChild(origLabel);
  origCol.appendChild(origContent);
  gridDiv.appendChild(origCol);

  // Translated text column
  const transCol = document.createElement('div');
  const transLabel = document.createElement('p');
  transLabel.style.cssText = 'margin:0 0 8px;font-weight:600;font-size:11px;color:#666;';
  transLabel.textContent = '✅ ' + (langNames[targetLang] || targetLang);
  const transContent = document.createElement('div');
  transContent.style.cssText = 'background:#e8f5e9;padding:12px;border-radius:8px;font-size:12px;line-height:1.6;color:#333;max-height:250px;overflow-y:auto;';
  const transText = translated.split('\n');
  transText.forEach((line, i) => {
    if (i > 0) transContent.appendChild(document.createElement('br'));
    transContent.appendChild(document.createTextNode(line));
  });
  transCol.appendChild(transLabel);
  transCol.appendChild(transContent);
  gridDiv.appendChild(transCol);
  modal.appendChild(gridDiv);

  // Buttons
  const buttonDiv = document.createElement('div');
  buttonDiv.style.cssText = 'display:flex;gap:8px;margin-top:16px;';
  const copyBtn = document.createElement('button');
  copyBtn.id = 'aitools-copy-tr';
  copyBtn.style.cssText = 'flex:1;background:#667eea;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
  copyBtn.textContent = '📋 Copier traduction';
  const closeBtn2 = document.createElement('button');
  closeBtn2.id = 'aitools-close-tr2';
  closeBtn2.style.cssText = 'flex:1;background:#ddd;color:#333;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
  closeBtn2.textContent = 'Fermer';
  buttonDiv.appendChild(copyBtn);
  buttonDiv.appendChild(closeBtn2);
  modal.appendChild(buttonDiv);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#aitools-close-tr').addEventListener('click', () => overlay.remove());
  modal.querySelector('#aitools-close-tr2').addEventListener('click', () => overlay.remove());
  modal.querySelector('#aitools-copy-tr').addEventListener('click', () => {
    navigator.clipboard.writeText(translated).then(() => {
      const copyBtn = modal.querySelector('#aitools-copy-tr');
      if (copyBtn) { copyBtn.textContent = '✅ Copié !'; setTimeout(() => { copyBtn.textContent = '📋 Copier traduction'; }, 2000); }
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================================
// QUICK STATS — Improvement D: add load time
// ============================================================================
function initQuickStats() {
  if (buttonVisibility.quickStatsWidget === false) return;
  const hostname = window.location.hostname;
  if (hostname.includes('google.') || hostname.includes('facebook.') ||
    hostname.includes('twitter.') || hostname.includes('instagram.') ||
    hostname.includes('youtube.') || hostname.includes('reddit.')) return;

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
      codeBlocks: document.querySelectorAll('code,pre').length,
      // Improvement D: page load time
      loadTime: Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart)
    };
    if (stats.links + stats.forms + stats.buttons < 3) return;
    createStatsWidget(stats);
  }, 4000);
}

function createStatsWidget(stats) {
  const widget = document.createElement('div');
  widget.id = 'aitools-quick-stats';
  widget.style.cssText = `
    position:fixed;bottom:20px;right:20px;background:rgba(255,255,255,0.95);
    border:1px solid #e0e0e0;border-radius:12px;padding:0;
    box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:999998;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:280px;
    cursor:pointer;user-select:none;transition:all 0.3s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:10px 14px;
    border-radius:12px;font-weight:600;font-size:12px;display:flex;align-items:center;
    justify-content:space-between;gap:8px;
  `;

  const headerLabel = document.createElement('span');
  headerLabel.textContent = '📊 Statistiques page';
  headerLabel.style.pointerEvents = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.textContent = '✕'; // Bug #9 Fix: textContent instead of innerHTML
  closeBtn.style.cssText = `background:rgba(255,255,255,0.3);border:none;color:white;width:18px;height:18px;
    border-radius:3px;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center;justify-content:center;`;
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
    { label: '🔗 Liens', value: stats.links },
    { label: '🖼️ Images', value: stats.images },
    { label: '📝 Paragraphes', value: stats.paragraphs },
    { label: '📰 Titres', value: stats.headings },
    { label: '🎥 Vidéos', value: stats.videos },
    { label: '📋 Formulaires', value: stats.forms },
    { label: '🔘 Boutons', value: stats.buttons },
    { label: '📊 Tableaux', value: stats.tables },
    { label: '💻 Code', value: stats.codeBlocks },
    { label: '⚡ Chargement', value: stats.loadTime > 0 ? stats.loadTime + ' ms' : 'N/A' }
  ];

  // Bug #9 Fix: Use createElement instead of innerHTML
  const statsGrid = document.createElement('div');
  statsGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:12px 0;';
  
  rows.filter(r => r.value && r.value !== 0).forEach(r => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:11px;';
    
    const label = document.createElement('span');
    label.style.color = '#666;';
    label.textContent = r.label;
    
    const value = document.createElement('span');
    value.style.cssText = 'color:#667eea;font-weight:600;';
    value.textContent = String(r.value);
    
    row.appendChild(label);
    row.appendChild(value);
    statsGrid.appendChild(row);
  });
  
  content.innerHTML = '';
  content.appendChild(statsGrid);

  header.addEventListener('click', (e) => {
    if (e.target.closest('.aitools-close-btn')) return;
    isExpanded = !isExpanded;
    content.style.maxHeight = isExpanded ? '300px' : '0';
    content.style.padding = isExpanded ? '0 14px' : '0 14px';
    header.style.borderRadius = isExpanded ? '12px 12px 0 0' : '12px';
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
  if (hostname.includes('google.') || hostname.includes('facebook.') ||
    hostname.includes('twitter.') || hostname.includes('instagram.') ||
    hostname.includes('youtube.') || hostname.includes('reddit.')) return;

  setTimeout(() => {
    const mainEl = document.querySelector('article') || document.querySelector('[role="main"]') ||
      document.querySelector('main') || document.body;
    const content = (mainEl?.innerText || '').slice(0, 50000);
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const mins = Math.ceil(words / 225);
    if (mins < 1 || words < 300) return;

    const badge = document.createElement('div');
    badge.id = 'aitools-reading-time';
    badge.style.cssText = `
      position:fixed;top:20px;right:20px;
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      color:white;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:600;
      box-shadow:0 4px 12px rgba(102,126,234,0.4);z-index:999999;cursor:pointer;
      user-select:none;transition:all 0.3s ease;
    `;
    badge.innerHTML = '';
    badge.textContent = `📖 ${mins} min`; // Bug #9 Fix: textContent instead of innerHTML
    badge.title = `${words.toLocaleString('fr-FR')} mots`;

    document.body.appendChild(badge);
    let hideTimer = setTimeout(() => { if (badge.isConnected) badge.style.opacity = '0.35'; }, 5000);
    badge.addEventListener('mouseover', () => { clearTimeout(hideTimer); badge.style.opacity = '1'; });
    badge.addEventListener('mouseout', () => {
      hideTimer = setTimeout(() => { if (badge.isConnected) badge.style.opacity = '0.35'; }, 5000);
    });
    makeDraggable(badge, 'aitools-reading-time-pos');
  }, 4000);
}

// ============================================================================
// FOCUS MODE
// ============================================================================
function initFocusMode() {
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      toggleFocusMode();
    }
  });

  if (buttonVisibility.focusModeBadge === false) return;

  const createFocusBtn = () => {
    if (!document.body) { setTimeout(createFocusBtn, 100); return; }
    if (document.getElementById('aitools-focus-mode-btn')) return;

    const focusBtn = document.createElement('button');
    focusBtn.id = 'aitools-focus-mode-btn';
    focusBtn.textContent = '🎯'; // Bug #9 Fix: textContent instead of innerHTML
    focusBtn.title = 'Shift+Alt+F : Mode focus';
    focusBtn.style.cssText = `
      position:fixed;top:80px;right:20px;width:38px;height:38px;border-radius:50%;
      background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border:2px solid white;
      color:white;font-size:16px;cursor:pointer;
      box-shadow:0 4px 12px rgba(245,87,108,0.4);z-index:999998;user-select:none;
      transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;
    `;

    const closeX = document.createElement('div');
    closeX.style.cssText = `
      position:absolute;top:-8px;right:-8px;width:18px;height:18px;border-radius:50%;
      background:#ff4757;color:white;font-size:10px;display:flex;align-items:center;
      justify-content:center;cursor:pointer;font-weight:bold;z-index:1;
    `;
    closeX.textContent = '✕';
    closeX.addEventListener('click', (e) => {
      e.stopPropagation();
      disableFocusMode();
      buttonVisibility.focusModeBadge = false;
      chrome.storage.local.set({ buttonVisibility });
      focusBtn.remove();
    });

    focusBtn.appendChild(closeX);
    focusBtn.addEventListener('click', (e) => {
      if (e.target === closeX || closeX.contains(e.target)) return;
      toggleFocusMode();
    });
    focusBtn.addEventListener('mouseover', () => { focusBtn.style.transform = 'scale(1.1)'; });
    focusBtn.addEventListener('mouseout', () => { focusBtn.style.transform = 'scale(1)'; });

    document.body.appendChild(focusBtn);
  };

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
      body,main,article,[role="main"],.content,.post,.article
      { margin:0!important;padding:20px!important;max-width:100%!important; }
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
  n.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(32,32,32,0.95);color:white;padding:14px 24px;border-radius:8px;
    font-size:14px;font-weight:500;z-index:1000000;pointer-events:none;
    animation:aitoolsFadeInOut 2s ease-in-out;
  `;
  n.innerHTML = '';
  n.textContent = message; // Bug #9 Fix: textContent instead of innerHTML
  if (!document.getElementById('aitools-focus-anim')) {
    const s = document.createElement('style');
    s.id = 'aitools-focus-anim';
    s.textContent = `
      @keyframes aitoolsFadeInOut {
        0%{opacity:0;transform:translate(-50%,-50%) scale(0.8);}
        10%{opacity:1;transform:translate(-50%,-50%) scale(1);}
        90%{opacity:1;}
        100%{opacity:0;}
      }
    `;
    document.head.appendChild(s);
  }
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}

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
    if (c) c.remove();

  } else if (req.action === 'updateSettings') {
    extensionSettings = { ...extensionSettings, ...req.settings };
    if (req.settings.cookieBlockerEnabled !== undefined) {
      if (req.settings.cookieBlockerEnabled && !cookieObserver) {
        initCookieBlocker();
      } else if (!req.settings.cookieBlockerEnabled && cookieObserver) {
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
    // Bug #7 fix: no 500-char line limit, use semantic extraction, 8000-char global limit
    const mainEl = document.querySelector('article, [role="main"], main') || document.body;
    const text = mainEl.innerText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 30)
      .join('\n')
      .substring(0, 8000);
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
