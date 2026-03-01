// AITools Content Script v4.0 - Optimized
// All features: Reading time, Dark mode, Notes, Google enhancements, Sponsor blocker, AI detector, Summarizer

let extensionEnabled = true;
let darkModeEnabled = false;
let readingTimeBadgeShown = false;
let aiDetectorEnabled = true;
let summarizerEnabled = true;

// Settings state
let extensionSettings = {
  aiDetectorEnabled: true,
  summarizerEnabled: true,
  autoTranslatorEnabled: true,
  translatorTargetLang: 'fr',
  summarizerLang: 'fr',
  aiDetectorSensitivity: 60,
  summarizerLength: 35,
  cookieBlockerEnabled: true,
  readingTimeEnabled: true,
  quickStatsEnabled: true
};

let elementVisibility = {
  aiBadge: true,
  summarizerBtn: true
};

// Load settings and visibility state from storage
chrome.storage.local.get(['aiDetectorSensitivity', 'summarizerLength', 'summarizerLang', 'aitools-visibility', 'autoTranslatorEnabled', 'translatorTargetLang', 'cookieBlockerEnabled', 'readingTimeEnabled', 'quickStatsEnabled'], (result) => {
  if (result.aiDetectorSensitivity) extensionSettings.aiDetectorSensitivity = parseInt(result.aiDetectorSensitivity);
  if (result.summarizerLength) extensionSettings.summarizerLength = parseInt(result.summarizerLength);
  if (result.summarizerLang) extensionSettings.summarizerLang = result.summarizerLang;
  if (result.autoTranslatorEnabled !== undefined) extensionSettings.autoTranslatorEnabled = result.autoTranslatorEnabled;
  if (result.translatorTargetLang) extensionSettings.translatorTargetLang = result.translatorTargetLang;
  if (result.cookieBlockerEnabled !== undefined) extensionSettings.cookieBlockerEnabled = result.cookieBlockerEnabled;
  if (result.readingTimeEnabled !== undefined) extensionSettings.readingTimeEnabled = result.readingTimeEnabled;
  if (result.quickStatsEnabled !== undefined) extensionSettings.quickStatsEnabled = result.quickStatsEnabled;
  if (result['aitools-visibility']) {
    elementVisibility = { ...elementVisibility, ...result['aitools-visibility'] };
  }
});

// ============================================================================
// DRAGGABLE UTILITY - Makes elements draggable and saves position
// ============================================================================
function makeDraggable(element, storageKey) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let wasFixed = false;

  // Load saved position
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
    // Don't drag if clicking buttons, close buttons, or interactive elements
    if (e.target.closest('button, a, input, select, textarea, .aitools-close-btn, .aitools-gb')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Save original position state
    wasFixed = element.style.position === 'fixed';
    
    // Switch to fixed positioning for dragging
    element.style.position = 'fixed';
    
    // Ensure the element is visible
    element.style.zIndex = '999999';
    
    // Calculate offset from mouse to element's top-left
    const rect = element.getBoundingClientRect();
    offsetX = rect.left - e.clientX;
    offsetY = rect.top - e.clientY;
    
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX + offsetX;
    const newY = e.clientY + offsetY;
    
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
    element.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'grab';
      
      // Save position
      const rect = element.getBoundingClientRect();
      const pos = {
        top: rect.top,
        left: rect.left
      };
      chrome.storage.local.set({ [storageKey]: pos });
    }
  });
  
  // Add visual feedback
  element.style.cursor = 'grab';
  element.style.transition = isDragging ? 'none' : 'all 0.2s';
}

// ============================================================================
// READING TIME ESTIMATOR - Popup discret en top
// ============================================================================
class ReadingTimeEstimator {
  constructor() {
    this.WORDS_PER_MINUTE = 200;
  }

  estimateReadingTime() {
    const text = document.body.innerText;
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / this.WORDS_PER_MINUTE);
    return { wordCount, readingTime };
  }

  showBadge() {
    // Only show once per page
    if (readingTimeBadgeShown) return;
    
    const { readingTime } = this.estimateReadingTime();
    const textLength = document.body.innerText.length;
    
    // Only show on article-like content (>2000 chars, >2 min read)
    if (textLength < 2000 || readingTime < 2) return;
    
    readingTimeBadgeShown = true;
    const badge = document.createElement('div');
    badge.id = 'aitools-rte-badge';
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 18px;
      border-radius: 24px;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
    `;
    badge.innerHTML = `⏰ ${readingTime} min`;
    badge.title = 'Temps de lecture estimé';
    
    document.body.appendChild(badge);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      if (badge && badge.parentNode) {
        badge.style.opacity = '0';
        badge.style.transition = 'opacity 0.3s';
        setTimeout(() => badge.remove?.(), 300);
      }
    }, 8000);
  }
}

// ============================================================================
// CURRENCY CONVERTER - Right-click menu
// ============================================================================
class CurrencyConverter {
  constructor() {
    this.rates = {};
    this.loadRates();
  }

  async loadRates() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      this.rates = data.rates || {};
    } catch (e) {
      console.log('[AITools] Cannot load exchange rates');
    }
  }

  convert(amount) {
    const eurRate = this.rates['EUR'] || 0.92;
    return (amount * eurRate).toFixed(2);
  }
}

// ============================================================================
// DARK MODE INJECTOR
// ============================================================================
function enableDarkMode() {
  if (document.getElementById('aitools-dark-css')) return;
  
  const style = document.createElement('style');
  style.id = 'aitools-dark-css';
  style.textContent = `
    * { 
      background-color: #1e1e1e !important; 
      color: #e4e4e4 !important;
      border-color: #444 !important;
    }
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
  document.addEventListener('mouseup', () => {
    const selected = window.getSelection().toString().trim();
    if (!selected) return;
    
    const menu = document.createElement('div');
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
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 10) + 'px';
    
    menu.innerHTML = `
      <button id="aitools-note-btn" data-text="${selected.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}">📝 Ajouter note</button>
    `;
    
    document.body.appendChild(menu);
    
    // Add event listener for note button (CSP compliant - no inline onclick)
    const noteBtn = document.getElementById('aitools-note-btn');
    if (noteBtn) {
      noteBtn.addEventListener('click', function() {
        const text = this.getAttribute('data-text');
        aiToolsAddNote(text);
      });
    }
    
    setTimeout(() => {
      const m = document.getElementById('aitools-highlight-menu');
      if (m) m.remove();
    }, 5000);
  });
}

window.aiToolsAddNote = function(text) {
  chrome.runtime.sendMessage({
    action: 'addNote',
    data: {
      text: text,
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    }
  });
};

// ============================================================================
// GOOGLE SEARCH ENHANCEMENTS
// ============================================================================
function setupGoogleEnhancements() {
  // Only on Google
  if (!window.location.hostname.includes('google.')) return;
  
  console.log('[AITools] Google enhancements loaded');
  
  // Inject buttons after page loads
  let isInjecting = false;
  const injectGoogleButtons = () => {
    // Prevent concurrent injections
    if (isInjecting) return;
    
    const searchForm = document.querySelector('form[action*="/search"]') || 
                       document.querySelector('form[role="search"]') ||
                       document.querySelector('form');
    
    if (!searchForm) return;
    
    let container = document.getElementById('aitools-google-buttons');
    if (container) return; // Already injected
    
    isInjecting = true;
    
    container = document.createElement('div');
    container.id = 'aitools-google-buttons';
    container.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    `;
    
    // Inject styles
    if (!document.getElementById('aitools-google-styles')) {
      const style = document.createElement('style');
      style.id = 'aitools-google-styles';
      style.textContent = `
        .aitools-gb {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          background: transparent;
          color: #5f6368;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          margin: 0 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .aitools-gb:hover {
          color: #202124;
          border-bottom-color: #d3d3d3;
        }
        .aitools-gb.active {
          color: #1f2937;
          border-bottom-color: #667eea;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Load visibility settings and custom config from storage
    chrome.storage.local.get(['googleButtonsVisibility', 'googleButtonsConfig'], (result) => {
      const visibility = result.googleButtonsVisibility || {};
      const config = result.googleButtonsConfig || {};
      
      // Button definitions with defaults
      const buttonDefs = [
        { key: 'lucky', label: '🍀 Chance', action: 'lucky' },
        { key: 'filters', label: '🔍 Filtres', action: 'filters' },
        { key: 'maps', label: '🗺️ Maps', action: 'maps' },
        { key: 'chatgpt', label: '🤖 ChatGPT', action: 'chatgpt' }
      ];
      
      buttonDefs.forEach((def) => {
        // Skip if disabled in settings
        if (visibility[def.key] === false) return;
        
        // Get custom config or defaults
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
          const input = searchForm.querySelector('input[name="q"]');
          const query = input?.value || '';
          
          if (!query.trim()) {
            alert('⚠️ Entrez une recherche');
            return;
          }
          
          switch (action) {
            case 'lucky':
              window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
              break;
            case 'maps':
              window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
              break;
            case 'chatgpt':
              window.open(`https://chatgpt.com?q=${encodeURIComponent(query)}`);
              break;
            case 'filters':
              alert('Les filtres avancés s\'ouvrent du menu de l\'extension');
              break;
          }
        });
        
        container.appendChild(btn);
      });
      
      // Only append container if has buttons
      if (container.children.length > 0) {
        searchForm.appendChild(container);
        
        // Make container draggable
        makeDraggable(container, 'aitools-google-buttons-pos');
        
        console.log('[AITools] Buttons injected on Google');
      }
      isInjecting = false;
    });
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectGoogleButtons);
  } else {
    injectGoogleButtons();
  }
  
  // Handle SPA navigation
  new MutationObserver(() => {
    if (!document.getElementById('aitools-google-buttons')) {
      injectGoogleButtons();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// ============================================================================
// BLOCK SPONSORED RESULTS
// ============================================================================
function blockSponsoredResults() {
  if (!window.location.hostname.includes('google.')) return;
  
  document.querySelectorAll('[data-sokoban-container]').forEach(el => {
    if (el.textContent.includes('Annonce') || el.textContent.includes('Ad')) {
      el.remove();
    }
  });
  
  // Alternative method
  document.querySelectorAll('div[data-ad-layout="ad"]').forEach(el => {
    el.remove();
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================
chrome.storage.local.get(null, (data) => {
  extensionEnabled = data.extensionEnabled !== false;
  darkModeEnabled = data.darkModeEnabled === true;
  
  // Initialize Google buttons visibility if not set
  if (!data.googleButtonsVisibility) {
    chrome.storage.local.set({
      googleButtonsVisibility: {
        lucky: true,
        filters: true,
        maps: true,
        chatgpt: true
      }
    });
  }
  
  // Initialize Google buttons customization if not set
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
  
  // Reading time estimator
  if (data.readingTimeEnabled !== false) {
    const estimator = new ReadingTimeEstimator();
    setTimeout(() => estimator.showBadge(), 1500);
  }
  
  // Dark mode
  if (darkModeEnabled) {
    enableDarkMode();
  }
  
  // Highlighter
  setupHighlighter();
  
  // Google features
  setupGoogleEnhancements();
  
  // Block sponsored
  if (data.blockSponsoredEnabled) {
    setTimeout(() => blockSponsoredResults(), 2000);
  }
});

// COOKIE BLOCKER - Auto-close cookie consent popups
// ============================================================================
function initCookieBlocker() {
  if (!extensionSettings.cookieBlockerEnabled) return;
  
  console.log('[AITools] Cookie blocker enabled');
  
  // Initial scan on page load
  setTimeout(() => {
    closeCookiePopups();
    blockCookieConsent();
  }, 1000);
  
  // Watch for new popups (dynamic popups on SPAs)
  const observer = new MutationObserver(() => {
    closeCookiePopups();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
  });
}

function closeCookiePopups() {
  // Common popup identifiers (ID, class, role)
  const popupSelectors = [
    // General popups
    '[id*="cookie"], [class*="cookie"], [id*="consent"], [class*="consent"]',
    '[id*="gdpr"], [class*="gdpr"], [id*="notification"], [class*="notification"]',
    '[id*="banner"], [class*="banner"], [id*="legal"], [class*="legal"]',
    '[role="dialog"][aria-label*="cookie" i], [role="dialog"][aria-label*="consent" i]',
    '[data-testid*="cookie"], [data-testid*="consent"]',
    // Specific popular services
    '[id*="onetrust"], [class*="onetrust"]',
    '[id*="cookiepro"], [class*="cookiepro"]',
    '[id*="crunchify"], [class*="crunchify"]',
    '[id*="borlabs"], [class*="borlabs"]',
    '[id*="termly"], [class*="termly"]'
  ];
  
  // Try to close all detected popups
  document.querySelectorAll(popupSelectors.join(', ')).forEach(popup => {
    // Skip if already hidden
    if (!isVisible(popup)) return;
    
    // Try to find and click accept button
    tryClickAcceptButton(popup);
  });
  
  // Remove backdrop/overlay
  document.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="dimmer"]').forEach(backdrop => {
    if (backdrop.offsetHeight > 0 && !backdrop.textContent.trim()) {
      backdrop.style.display = 'none';
    }
  });
}

function blockCookieConsent() {
  // Try to block specific cookie consent scripts
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    const src = script.src || '';
    if (src.includes('cookiebot') || src.includes('consent') || src.includes('gdpr')) {
      // Already loaded, but we can try to disable notifications
      if (window.CookieNotice) {
        try {
          window.CookieNotice.hide?.();
          console.log('[AITools] Hid CookieNotice');
        } catch (e) {}
      }
    }
  });
}

function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetHeight > 0;
}

function tryClickAcceptButton(popup) {
  const acceptPatterns = [
    'accept all',      // Accept All
    'accepter tout',   // French: Accept All
    'tout accepter',   // French: Accept All
    'j\'accepte',      // French: I Accept
    'agree',           // I Agree
    'allow all',       // Allow All
    'autoriser tout',  // French: Allow All
    'confirm',         // Confirm
    'continue',        // Continue
    'ok',              // OK
    'yes, i accept',   // Affirmative
    'oui, j\'accepte', // French: Yes, I accept
    'aceptar',         // Spanish: Accept
    'alle akzeptieren',// German: Accept All
    'accetta',         // Italian: Accept
    'accept',          // Accept
    'concordo',        // Italian: I agree
  ];
  
  // Search for buttons with accept-like text
  const buttons = popup.querySelectorAll('button, a[role="button"], [role="button"]');
  
  for (const btn of buttons) {
    const btnText = btn.textContent.toLowerCase().trim();
    const btnClass = btn.className.toLowerCase();
    const btnId = btn.id.toLowerCase();
    
    // Check text content
    for (const pattern of acceptPatterns) {
      if (btnText.includes(pattern)) {
        console.log('[AITools] Clicking accept button:', btnText);
        btn.click();
        return true;
      }
    }
    
    // Check class/id for common patterns
    if (btnClass.includes('accept') || btnClass.includes('agree') || 
        btnId.includes('accept') || btnId.includes('agree')) {
      console.log('[AITools] Clicking button with class/id:', btn.className);
      btn.click();
      return true;
    }
  }
  
  // If no button found, hide the popup
  popup.style.display = 'none';
  popup.style.visibility = 'hidden';
  popup.style.opacity = '0';
  popup.setAttribute('hidden', 'true');
  console.log('[AITools] Hidden popup (no accept button found)');
  return false;
}

// ============================================================================
// AI DETECTOR - Automatic highlighting
// ============================================================================
function initAIDetector() {
  if (!extensionSettings.aiDetectorEnabled) return;
  
  setTimeout(() => {
    const text = document.body.innerText;
    if (text.length < 200) return;
    
    const score = detectAIText(text);
    const threshold = extensionSettings.aiDetectorSensitivity || 60;
    if (score > threshold) {
      showAIBadge(score);
    }
  }, 2000);
}

function detectAIText(text) {
  let score = 0;
  
  // Pattern indicators
  const patterns = {
    passiveVoice: /(\bwas\b|\bwere\b|\bbeing\b|\bby\b)/gi,
    repetitiveStructure: /(\.\s[A-Z][a-z]{3,})/g,
    formalTone: /(\bthus\b|\btherefore\b|\bin conclusion\b|\bmoreover\b|^\b[A-Z]{2,})/gm,
    genericOpenings: /^(this|it|the)[^.]{0,80}(is|was|are)/gim,
  };
  
  // Score patterns
  const passiveCount = (text.match(patterns.passiveVoice) || []).length;
  const structureCount = (text.match(patterns.repetitiveStructure) || []).length;
  const formalCount = (text.match(patterns.formalTone) || []).length;
  const genericCount = (text.match(patterns.genericOpenings) || []).length;
  
  const wordCount = text.split(/\s+/).length;
  
  score += (passiveCount / wordCount * 100) * 0.3;
  score += (structureCount / text.split('.').length * 100) * 0.4;
  score += (formalCount / text.split('\n').length * 100) * 0.2;
  score += (genericCount / text.split('\n').length * 100) * 0.1;
  
  return Math.min(100, Math.round(score));
}

function showAIBadge(score) {
  if (!elementVisibility.aiBadge) return;
  if (document.getElementById('aitools-ai-badge')) return;
  
  const badge = document.createElement('div');
  badge.id = 'aitools-ai-badge';
  badge.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
    cursor: grab;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    user-select: none;
  `;
  
  const scoreColor = score > 75 ? '#ff4444' : score > 50 ? '#ff9800' : '#ffc107';
  
  const scoreSpan = document.createElement('span');
  scoreSpan.textContent = `⚠️ IA: ${score}%`;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.3);
    border: none;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  
  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.5)';
  });
  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
  });
  closeBtn.addEventListener('click', () => {
    elementVisibility.aiBadge = false;
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
    badge.remove();
  });
  
  badge.appendChild(scoreSpan);
  badge.appendChild(closeBtn);
  badge.style.background = scoreColor;
  badge.title = `Probabilité de contenu généré par IA: ${score}% (Déplaçable)`;
  
  document.body.appendChild(badge);
  
  // Make it draggable
  makeDraggable(badge, 'aitools-ai-badge-pos');
  
  setTimeout(() => {
    badge.style.opacity = '0.7';
  }, 3000);
}

// ============================================================================
// SUMMARIZER - Top button for page summarization
// ============================================================================
function initSummarizer() {
  // Don't show summarizer on Google Search results
  if (window.location.hostname.includes('google.')) return;
  if (!extensionSettings.summarizerEnabled) return;
  
  // Check for long text on page load
  setTimeout(() => {
    checkAndShowSummarizerButton();
  }, 1500);
  
  // Also watch for content changes
  const observer = new MutationObserver(() => {
    setTimeout(checkAndShowSummarizerButton, 500);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function checkAndShowSummarizerButton() {
  const pageText = document.body.innerText;
  
  // Only show if not already shown AND enough content
  if (!document.getElementById('aitools-summarize-btn') && pageText.length > 800) {
    addSummarizerButton();
  } else if (document.getElementById('aitools-summarize-btn') && pageText.length < 300) {
    // Remove button if content becomes too short
    document.getElementById('aitools-summarize-btn')?.remove();
  }
}

function addSummarizerButton() {
  const btn = document.createElement('button');
  btn.id = 'aitools-summarize-btn';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: grab;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    user-select: none;
  `;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = '✂️ Résumer';
  textSpan.style.pointerEvents = 'none';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'aitools-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.3);
    border: none;
    color: white;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  
  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.5)';
  });
  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elementVisibility.summarizerBtn = false;
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
    btn.remove();
  });
  
  btn.appendChild(textSpan);
  btn.appendChild(closeBtn);
  btn.title = 'Déplaçable - Cliquez pour résumer la page';
  
  btn.addEventListener('click', (e) => {
    if (!e.target.closest('.aitools-close-btn')) {
      const summary = summarizePage();
      showSummaryModal(summary);
    }
  });
  
  document.body.appendChild(btn);
  
  // Make it draggable
  makeDraggable(btn, 'aitools-summarize-btn-pos');
}

function summarizePage() {
  const paragraphs = Array.from(document.querySelectorAll('p, article, section, div[role="main"]'))
    .map(el => el.innerText)
    .filter(text => text.length > 100)
    .slice(0, 20);
  
  const fullText = paragraphs.join('\n\n');
  return betterSummarize(fullText);
}

function betterSummarize(text) {
  if (!text || text.length < 100) return text;
  
  // Clean text - remove extra whitespace and newlines
  let cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Step 1: Split into sentences more carefully
  // Avoid splitting on decimals (.5), abbreviations (M. Smith, U.S.A), URLs
  let sentences = [];
  let current = '';
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    current += char;
    
    // Check if we found end of sentence
    if ((char === '.' || char === '!' || char === '?') && i < cleanText.length - 1) {
      const nextChar = cleanText[i + 1];
      const prevChar = cleanText[i - 1];
      
      // Skip if it's a decimal, abbreviation, or URL
      const isDecimal = prevChar && /\d/.test(prevChar) && nextChar && /\d/.test(nextChar);
      const isAbbrev = /[A-Z]$/.test(current.trim());
      const isUrl = current.includes('http') || current.includes('www');
      
      if (!isDecimal && !isUrl && nextChar === ' ') {
        sentences.push(current.trim());
        current = '';
      }
    } else if ((char === '.' || char === '!' || char === '?') && i === cleanText.length - 1) {
      sentences.push(current.trim());
      current = '';
    }
  }
  
  if (current.length > 0) sentences.push(current.trim());
  
  // Filter sentences: too short or too long
  sentences = sentences
    .filter(s => s.length > 20 && s.length < 600)
    .filter(s => s.split(/\s+/).length > 3);
  
  if (sentences.length === 0) return text.substring(0, 300) + '...';
  if (sentences.length <= 2) return sentences.join(' ');
  
  // Step 2: Score sentences with more relevant keywords
  const keywords = {
    // Importance
    'important': 6, 'clé': 6, 'capital': 5, 'crucial': 6, 'essentiel': 5,
    // Results
    'résultat': 5, 'conclusion': 5, 'résultats': 5, 'conclusions': 5,
    'démonstration': 4, 'montre': 4, 'prouve': 4, 'révèle': 4,
    // Discovery
    'découvert': 5, 'découverte': 5, 'innovation': 4, 'novateur': 4,
    'unique': 4, 'exclusivité': 4, 'nouveau': 3, 'inédit': 5,
    // Data
    'étude': 4, 'recherche': 4, 'données': 5, 'statistiques': 5,
    'analyse': 4, 'rapport': 4, 'expert': 3,
    // Success
    'succès': 4, 'réussi': 4, 'victoire': 4, 'gagné': 3,
    // Impact
    'impact': 5, 'influence': 4, 'effet': 3, 'conséquence': 3,
    // Logic markers
    'donc': 3, 'cependant': 2, 'mais': 2, 'pourtant': 2,
    'c\'est pourquoi': 3, 'par conséquent': 3
  };
  
  const scoredSentences = sentences.map((sentence, idx) => {
    let score = 1;
    const lowerSent = sentence.toLowerCase();
    const wordCount = sentence.split(/\s+/).length;
    
    // Keyword matching
    for (const [keyword, weight] of Object.entries(keywords)) {
      if (lowerSent.includes(keyword)) {
        score += weight;
      }
    }
    
    // Position bonus (first, second, last important)
    if (idx === 0) score += 5;      // First sentence very important
    if (idx === 1) score += 3;      // Second
    if (idx === sentences.length - 1) score += 4;  // Last sentence (conclusion)
    if (idx === sentences.length - 2) score += 2;  // Pre-last
    
    // Optimal length: 15-50 words
    if (wordCount >= 15 && wordCount <= 50) {
      score += 4;
    } else if (wordCount >= 10 && wordCount < 15) {
      score += 1;
    } else if (wordCount > 50 && wordCount < 100) {
      score += 1;
    } else if (wordCount < 10 || wordCount > 100) {
      score -= 2;  // Penalize very short or very long
    }
    
    // Numbers/data/percentages
    if (/\d+/.test(sentence)) score += 4;
    
    // Questions (usually summary-worthy)
    if (sentence.includes('?')) score += 3;
    
    // Quoted text
    if (sentence.includes('"') || sentence.includes("'")) score += 2;
    
    return { sentence, score, index: idx };
  });
  
  // Sort by score and select top percentage
  const percentage = Math.max(0.15, Math.min(0.8, (extensionSettings.summarizerLength || 35) / 100));
  const keepCount = Math.max(2, Math.ceil(sentences.length * percentage));
  
  const selected = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);
  
  // Join and return without hard truncation
  const summary = selected.join(' ');
  
  return summary;
}

function showSummaryModal(summary) {
  const overlay = document.createElement('div');
  overlay.id = 'aitools-summary-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 600px;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 10001;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  
  const targetLang = extensionSettings.summarizerLang || 'fr';
  const pageLanguage = detectLanguageOfText(summary);
  
  // If language is different, translate the summary
  if (pageLanguage && pageLanguage !== targetLang) {
    chrome.runtime.sendMessage(
      { action: 'translateText', text: summary, targetLang: targetLang },
      (response) => {
        if (response && response.success) {
          const translatedSummary = response.text || summary;
          modal.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">📋 Résumé de la page</h3>
            <p style="line-height: 1.8; color: #555; font-size: 13px;">${translatedSummary.replace(/\n/g, '<br>')}</p>
            <small style="color: #999; font-size: 10px;">Résumé traduit en ${getLanguageName(targetLang)}</small>
            <button id="aitools-close-summary" style="
              background: #667eea;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 16px;
              font-size: 12px;
              display: block;
              width: 100%;
            ">Fermer</button>
          `;
        } else {
          // Fallback: show untranslated summary
          modal.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">📋 Résumé de la page</h3>
            <p style="line-height: 1.8; color: #555; font-size: 13px;">${summary.replace(/\n/g, '<br>')}</p>
            <button id="aitools-close-summary" style="
              background: #667eea;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 16px;
              font-size: 12px;
              display: block;
              width: 100%;
            ">Fermer</button>
          `;
        }
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        setupCloseButton(overlay, modal);
      }
    );
  } else {
    // No translation needed
    modal.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">📋 Résumé de la page</h3>
      <p style="line-height: 1.8; color: #555; font-size: 13px;">${summary.replace(/\n/g, '<br>')}</p>
      <button id="aitools-close-summary" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 16px;
        font-size: 12px;
        display: block;
        width: 100%;
      ">Fermer</button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setupCloseButton(overlay, modal);
  }
}

function setupCloseButton(overlay, modal) {
  const closeBtn = overlay.querySelector('#aitools-close-summary');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function getLanguageName(lang) {
  const names = {
    'fr': 'Français',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'pt': 'Portugais',
    'ja': 'Japonais',
    'zh': 'Chinois'
  };
  return names[lang] || lang.toUpperCase();
}

// ============================================================================
// AUTO TRANSLATOR - Detect and translate foreign text
// ============================================================================

// Language detection patterns
function detectLanguageOfText(text) {
  if (!text || text.length < 5) return null;
  
  // French indicators
  if (/\b(le|la|les|de|des|et|un|une|est|sont|était|au|à|pour|que|qui)\b/i.test(text)) {
    if (/(ç|œ|é|è|ê|ë|à|ù|û|ô|ö)/i.test(text) || /\b(bonjour|salut|merci|s'il|c'est|qu'est|quoi|comment|pourquoi)\b/i.test(text)) {
      return 'fr';
    }
  }
  
  // Spanish indicators
  if (/\b(el|la|los|las|de|para|que|es|está|son|están|una|un)\b/i.test(text)) {
    if (/(á|é|í|ó|ú|ñ|¡|¿)/i.test(text) || /\b(hola|gracias|qué|cómo|por qué|señor|señora)\b/i.test(text)) {
      return 'es';
    }
  }
  
  // German indicators
  if (/\b(der|die|das|und|in|mit|zu|von|ein|eine|ist|sind|war|waren)\b/i.test(text)) {
    if (/(ä|ö|ü|ß)/i.test(text) || /\b(hallo|danke|ja|nein|wie|was|wo|wann)\b/i.test(text)) {
      return 'de';
    }
  }
  
  // Italian indicators
  if (/\b(il|lo|la|i|gli|le|di|da|per|che|è|sono|sono)\b/i.test(text)) {
    if (/(à|è|é|ì|ò|ù)/i.test(text) || /\b(ciao|grazie|per favore|come|cosa|dove)\b/i.test(text)) {
      return 'it';
    }
  }
  
  // Portuguese indicators
  if (/\b(o|a|os|as|de|para|que|é|são|um|uma|em|com)\b/i.test(text)) {
    if (/(ã|õ|ç|á|é|í|ó|ú|à)/i.test(text) || /\b(olá|obrigado|por favor|como|qual|onde)\b/i.test(text)) {
      return 'pt';
    }
  }
  
  // Japanese (Very basic - just check for Japanese characters)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g.test(text)) {
    return 'ja';
  }
  
  // Chinese (Simplified and Traditional)
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/g.test(text)) {
    return 'zh';
  }
  
  return 'en'; // Default to English
}

// Translate using Background Script (avoids CSP issues)
async function translateText(text, targetLang = 'fr') {
  if (!text || text.length === 0) return null;
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'translateText', text, targetLang },
      (response) => {
        if (response && response.success) {
          resolve(response.text);
        } else {
          console.log('[AITools] Translation failed:', response?.error);
          resolve(null);
        }
      }
    );
  });
}

// Add translation buttons to paragraphs
function initAutoTranslator() {
  if (!extensionSettings.autoTranslatorEnabled) return;
  
  setTimeout(() => {
    const paragraphs = document.querySelectorAll('p, article, h1, h2, h3, div[role="article"]');
    let count = 0;
    
    paragraphs.forEach((para) => {
      if (count >= 5) return; // Limit to 5 translation buttons per page
      
      const text = para.innerText;
      if (text.length < 50) return;
      
      const detectedLang = detectLanguageOfText(text);
      const targetLang = extensionSettings.translatorTargetLang || 'fr';
      
      // Only add button if text is in a different language
      if (detectedLang && detectedLang !== targetLang) {
        addTranslationButton(para, text, detectedLang, targetLang);
        count++;
      }
    });
  }, 2000);
}

function addTranslationButton(element, text, sourceLang, targetLang) {
  // Check if button already added
  if (element.querySelector('.aitools-translate-btn')) return;
  
  const btn = document.createElement('button');
  btn.className = 'aitools-translate-btn';
  btn.innerHTML = '🌐 Traduire';
  btn.style.cssText = `
    display: inline-block;
    margin-left: 8px;
    padding: 6px 12px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: grab;
    font-weight: 600;
    transition: all 0.2s;
    position: relative;
    z-index: 9998;
  `;
  
  btn.addEventListener('mouseover', () => {
    btn.style.background = '#45a049';
    btn.style.cursor = 'grab';
  });
  btn.addEventListener('mouseout', () => {
    btn.style.background = '#4CAF50';
  });
  
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    btn.innerHTML = '⏳...';
    btn.disabled = true;
    
    const translated = await translateText(text, targetLang);
    
    if (translated) {
      showTranslationModal(text, translated, sourceLang, targetLang);
      btn.innerHTML = '✅ Traduit!';
      setTimeout(() => {
        btn.innerHTML = '🌐 Traduire';
        btn.disabled = false;
      }, 2000);
    } else {
      btn.innerHTML = '❌ Erreur';
      setTimeout(() => {
        btn.innerHTML = '🌐 Traduire';
        btn.disabled = false;
      }, 2000);
    }
  });
  
  element.appendChild(btn);
  
  // Make button draggable with unique storage key
  const uniqueKey = 'aitools-translate-btn-' + Math.random().toString(36).substring(7);
  makeDraggable(btn, uniqueKey);
}

function showTranslationModal(originalText, translatedText, sourceLang, targetLang) {
  const langNames = {
    'fr': 'Français',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'pt': 'Portugais',
    'ja': 'Japonais',
    'zh': 'Chinois'
  };
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 10001;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  
  const srcLangName = langNames[sourceLang] || 'Source';
  const tgtLangName = langNames[targetLang] || 'Cible';
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: #333;">🌐 Traduction</h3>
      <button id="aitools-close-translation" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">✕</button>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #666; font-size: 12px;">📄 ${srcLangName}</p>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; line-height: 1.6; color: #555; font-size: 13px; max-height: 300px; overflow-y: auto;">
          ${originalText.replace(/\n/g, '<br>')}
        </div>
      </div>
      <div>
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #666; font-size: 12px;">✅ ${tgtLangName}</p>
        <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; line-height: 1.6; color: #333; font-size: 13px; max-height: 300px; overflow-y: auto;">
          ${translatedText.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
    
    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <button id="aitools-copy-translation" style="
        flex: 1;
        background: #667eea;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      ">📋 Copier traduction</button>
      <button id="aitools-close-translation-btn" style="
        flex: 1;
        background: #ddd;
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      ">Fermer</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  document.getElementById('aitools-close-translation').addEventListener('click', () => overlay.remove());
  document.getElementById('aitools-close-translation-btn').addEventListener('click', () => overlay.remove());
  
  document.getElementById('aitools-copy-translation').addEventListener('click', () => {
    navigator.clipboard.writeText(translatedText).then(() => {
      alert('✅ Texte traduit copié !');
    });
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ============================================================================
// QUICK STATS - Display page statistics
// ============================================================================
function initQuickStats() {
  // Don't show stats on Google Search results
  if (window.location.hostname.includes('google.')) return;
  
  // Calculate page statistics
  const stats = {
    images: document.querySelectorAll('img').length,
    links: document.querySelectorAll('a').length,
    paragraphs: document.querySelectorAll('p').length,
    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    videos: document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    forms: document.querySelectorAll('form').length,
    inputs: document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').length,
    buttons: document.querySelectorAll('button').length,
    tables: document.querySelectorAll('table').length,
    codeBlocks: document.querySelectorAll('code, pre').length
  };
  
  // Don't show if no meaningful data
  const totalInteractiveElements = stats.links + stats.forms + stats.buttons;
  if (totalInteractiveElements < 3) return;
  
  // Create stats widget
  const widget = document.createElement('div');
  widget.id = 'aitools-quick-stats';
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    max-width: 280px;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px 12px 0 0;
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  `;
  header.innerHTML = '📊 Statistiques page';
  
  let isExpanded = false;
  
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 16px;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    border-top: 1px solid #e0e0e0;
  `;
  
  // Build stats rows
  const statsRows = [
    { label: '🔗 Liens', value: stats.links },
    { label: '🖼️ Images', value: stats.images },
    { label: '📝 Paragraphes', value: stats.paragraphs },
    { label: '📰 Titres', value: stats.headings },
    { label: '🎥 Vidéos', value: stats.videos },
    { label: '📋 Formulaires', value: stats.forms },
    { label: '🔘 Boutons', value: stats.buttons },
    { label: '📊 Tableaux', value: stats.tables },
    { label: '💻 Code', value: stats.codeBlocks }
  ];
  
  let htmlContent = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
  statsRows.forEach(row => {
    if (row.value > 0) {
      htmlContent += `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px;">
          <span style="color: #666;">${row.label}</span>
          <span style="color: #667eea; font-weight: 600;">${row.value}</span>
        </div>
      `;
    }
  });
  htmlContent += '</div>';
  
  content.innerHTML = htmlContent;
  
  // Toggle expand/collapse
  header.addEventListener('click', () => {
    isExpanded = !isExpanded;
    if (isExpanded) {
      content.style.maxHeight = '400px';
      header.style.borderRadius = '12px 12px 0 0';
    } else {
      content.style.maxHeight = '0';
    }
  });
  
  widget.appendChild(header);
  widget.appendChild(content);
  document.body.appendChild(widget);
  
  // Hover effects
  widget.addEventListener('mouseover', () => {
    widget.style.transform = 'translateY(-4px)';
    widget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.16)';
  });
  
  widget.addEventListener('mouseout', () => {
    widget.style.transform = 'translateY(0)';
    widget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
  });
  
  // Make draggable
  makeDraggable(widget, 'aitools-quick-stats-pos');
}
function initReadingTime() {
  // Don't show reading time on Google Search results
  if (window.location.hostname.includes('google.')) return;
  if (!extensionSettings.readingTimeEnabled) return;
  
  const mainContent = document.body.innerText || '';
  const words = mainContent.split(/\s+/).filter(w => w.length > 0).length;
  
  // Average reading speed: 200-250 words per minute
  const readingTimeMinutes = Math.ceil(words / 225);
  
  if (readingTimeMinutes < 1 || words < 300) return; // Too short to display
  
  const timeDisplay = readingTimeMinutes === 1 
    ? '1 min de lecture' 
    : `${readingTimeMinutes} min de lecture`;
  
  // Create reading time badge
  const badge = document.createElement('div');
  badge.id = 'aitools-reading-time';
  badge.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    z-index: 999999;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  badge.innerHTML = `📖 ${timeDisplay}`;
  
  badge.addEventListener('mouseover', () => {
    badge.style.transform = 'scale(1.05)';
    badge.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
  });
  
  badge.addEventListener('mouseout', () => {
    badge.style.transform = 'scale(1)';
    badge.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  badge.title = `Temps estimé: ${words.toLocaleString('fr-FR')} mots`;
  
  document.body.appendChild(badge);
  
  // Auto-hide badge after 5 seconds if not hovered
  let hideTimer = setTimeout(() => {
    if (document.getElementById('aitools-reading-time')) {
      badge.style.opacity = '0.3';
    }
  }, 5000);
  
  // Show on hover
  badge.addEventListener('mouseover', () => {
    clearTimeout(hideTimer);
    badge.style.opacity = '1';
  });
  
  badge.addEventListener('mouseout', () => {
    hideTimer = setTimeout(() => {
      badge.style.opacity = '0.3';
    }, 5000);
  });
  
  // Draggable
  makeDraggable(badge, 'aitools-reading-time-pos');
}

// ============================================================================
// FOCUS MODE - Hide distractions for better reading
// ============================================================================
function initFocusMode() {
  // Add a keyboard shortcut badge (visible on Shift+Alt+F)
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      toggleFocusMode();
    }
  });
  
  // Also add a quick button near reading time badge
  const focusBtn = document.createElement('button');
  focusBtn.id = 'aitools-focus-mode-btn';
  focusBtn.innerHTML = '🎯';
  focusBtn.title = 'Shift+Alt+F: Mode focus';
  focusBtn.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border: 2px solid white;
    color: white;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
    z-index: 999998;
    user-select: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  focusBtn.addEventListener('click', toggleFocusMode);
  focusBtn.addEventListener('mouseover', () => {
    focusBtn.style.transform = 'scale(1.1)';
    focusBtn.style.boxShadow = '0 6px 16px rgba(245, 87, 108, 0.6)';
  });
  focusBtn.addEventListener('mouseout', () => {
    focusBtn.style.transform = 'scale(1)';
    focusBtn.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.4)';
  });
  
  document.body.appendChild(focusBtn);
}

function toggleFocusMode() {
  const focusState = document.body.getAttribute('data-aitools-focus');
  
  if (focusState === 'active') {
    // Disable focus mode
    disableFocusMode();
  } else {
    // Enable focus mode
    enableFocusMode();
  }
}

function enableFocusMode() {
  document.body.setAttribute('data-aitools-focus', 'active');
  
  // Create CSS to hide distractions
  let styleId = 'aitools-focus-mode-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Hide common distraction elements */
      [class*="ad"], [class*="advertisement"], [id*="ad"], [id*="advertisement"],
      [class*="sidebar"], [id*="sidebar"], [class*="widget"], [id*="widget"],
      [class*="footer"], [id*="footer"], [class*="nav"], [id*="nav"],
      [role="complementary"], [role="navigation"],
      .header, #header, header,
      .notification, .banner, .popup, .modal:not(#aitools-modal),
      iframe[src*="ads"], iframe[src*="doubleclick"],
      [data-ad-format], [data-ad-slot]
      {
        display: none !important;
      }
      
      /* Adjust main content to full width */
      body, main, article, [role="main"], .content, .post, .article {
        margin: 0 !important;
        padding: 20px !important;
        max-width: 100% !important;
      }
      
      /* Better focus on text */
      body {
        background-color: #fafafa !important;
        line-height: 1.8 !important;
      }
      
      p, article, main {
        color: #333 !important;
      }
      
      /* Highlight current reading area */
      p:focus-within, article:focus-within, main:focus-within {
        background-color: #fff9e6 !important;
        transition: background-color 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Show toast notification
  showFocusNotification('🎯 Mode focus activé! Appuyez sur Shift+Alt+F pour désactiver');
  
  // Update button style
  const btn = document.getElementById('aitools-focus-mode-btn');
  if (btn) {
    btn.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    btn.style.transform = 'scale(1.2)';
  }
}

function disableFocusMode() {
  document.body.removeAttribute('data-aitools-focus');
  
  // Remove focus mode styles
  const style = document.getElementById('aitools-focus-mode-styles');
  if (style) style.remove();
  
  // Show toast notification
  showFocusNotification('Mode focus désactivé');
  
  // Update button style
  const btn = document.getElementById('aitools-focus-mode-btn');
  if (btn) {
    btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    btn.style.transform = 'scale(1)';
  }
}

function showFocusNotification(message) {
  // Remove existing notification
  const existing = document.getElementById('aitools-focus-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'aitools-focus-notification';
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(32, 32, 32, 0.95);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000000;
    animation: fadeInOut 2s ease-in-out;
  `;
  notification.innerHTML = message;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}

// Initialize features
chrome.storage.local.get(null, (data) => {
  if (data.aiDetectorEnabled !== undefined) extensionSettings.aiDetectorEnabled = data.aiDetectorEnabled;
  if (data.summarizerEnabled !== undefined) extensionSettings.summarizerEnabled = data.summarizerEnabled;
  if (data.autoTranslatorEnabled !== undefined) extensionSettings.autoTranslatorEnabled = data.autoTranslatorEnabled;
  if (data.translatorTargetLang) extensionSettings.translatorTargetLang = data.translatorTargetLang;
  if (data.cookieBlockerEnabled !== undefined) extensionSettings.cookieBlockerEnabled = data.cookieBlockerEnabled;
  if (data.readingTimeEnabled !== undefined) extensionSettings.readingTimeEnabled = data.readingTimeEnabled;
  if (data.quickStatsEnabled !== undefined) extensionSettings.quickStatsEnabled = data.quickStatsEnabled;
  
  initAIDetector();
  initSummarizer();
  initAutoTranslator();
  initCookieBlocker();
  initReadingTime();
  initQuickStats();
  initFocusMode();
});

// ============================================================================
// MESSAGE LISTENER
// ============================================================================
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'resetPositions') {
    // Remove all saved positions from storage
    chrome.storage.local.remove(['aitools-ai-badge-pos', 'aitools-summarize-btn-pos']);
    // Reload positions
    location.reload();
  } else if (req.action === 'updateGoogleButtons') {
    // Update Google button visibility and/or config, then re-render
    // Save visibility changes if provided
    if (req.visibility) {
      chrome.storage.local.set({ googleButtonsVisibility: req.visibility });
    }
    
    // Save config changes if provided
    if (req.config) {
      chrome.storage.local.set({ googleButtonsConfig: req.config });
    }
    
    // Remove existing container and re-inject buttons
    const container = document.getElementById('aitools-google-buttons');
    if (container) {
      container.remove();
    }
    
    // Re-inject buttons with new settings
    const searchForm = document.querySelector('form[action*="/search"]') || 
                       document.querySelector('form[role="search"]') ||
                       document.querySelector('form');
    
    if (searchForm) {
      // Re-run injection with updated storage values
      const injectGoogleButtons = () => {
        let newContainer = document.getElementById('aitools-google-buttons');
        if (newContainer) return; // Already injected
        
        newContainer = document.createElement('div');
        newContainer.id = 'aitools-google-buttons';
        newContainer.style.cssText = `
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        `;
        
        // Load both visibility and config from storage
        chrome.storage.local.get(['googleButtonsVisibility', 'googleButtonsConfig'], (result) => {
          const visibility = result.googleButtonsVisibility || {};
          const config = result.googleButtonsConfig || {};
          
          // Buttons config
          const buttons = [
            { key: 'lucky', label: '🍀 Chance', action: 'lucky' },
            { key: 'filters', label: '🔍 Filtres', action: 'filters' },
            { key: 'maps', label: '🗺️ Maps', action: 'maps' },
            { key: 'chatgpt', label: '🤖 ChatGPT', action: 'chatgpt' }
          ];
          
          buttons.forEach((cfg) => {
            // Skip if disabled in settings
            if (visibility[cfg.key] === false) return;
            
            // Get custom config or defaults
            const customConfig = config[cfg.key] || {};
            const label = customConfig.label || cfg.label;
            const action = customConfig.action || cfg.action;
            const color = customConfig.color || '#5f6368';
            
            const btn = document.createElement('button');
            btn.className = 'aitools-gb';
            btn.innerHTML = label;
            btn.type = 'button';
            btn.id = `aitools-gb-${cfg.key}`;
            btn.style.color = color;
            
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              const input = searchForm.querySelector('input[name="q"]');
              const query = input?.value || '';
              
              if (!query.trim()) {
                alert('⚠️ Entrez une recherche');
                return;
              }
              
              switch (action) {
                case 'lucky':
                  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
                  break;
                case 'maps':
                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
                  break;
                case 'chatgpt':
                  window.open(`https://chatgpt.com?q=${encodeURIComponent(query)}`);
                  break;
                case 'filters':
                  alert('Les filtres avancés s\'ouvrent du menu de l\'extension');
                  break;
              }
            });
            
            newContainer.appendChild(btn);
          });
          
          // Only append container if has buttons
          if (newContainer.children.length > 0) {
            searchForm.appendChild(newContainer);
            
            // Make container draggable
            makeDraggable(newContainer, 'aitools-google-buttons-pos');
            
            console.log('[AITools] Google buttons updated');
          }
        });
        
        injectGoogleButtons();
      }
    }
  } else if (req.action === 'updateSettings') {
    // Merge settings instead of replacing
    extensionSettings = { ...extensionSettings, ...req.settings };
    
    if (req.settings.aiDetectorEnabled) {
      elementVisibility.aiBadge = true;
      if (!document.getElementById('aitools-ai-badge')) {
        initAIDetector();
      }
    }
    
    if (req.settings.summarizerEnabled) {
      elementVisibility.summarizerBtn = true;
      if (!document.getElementById('aitools-summarize-btn')) {
        initSummarizer();
      }
    }
    
    // Save individual settings
    if (req.settings.aiDetectorSensitivity !== undefined) {
      chrome.storage.local.set({ aiDetectorSensitivity: req.settings.aiDetectorSensitivity });
    }
    
    if (req.settings.summarizerLength !== undefined) {
      chrome.storage.local.set({ summarizerLength: req.settings.summarizerLength });
    }
    
    if (req.settings.summarizerLang !== undefined) {
      extensionSettings.summarizerLang = req.settings.summarizerLang;
      chrome.storage.local.set({ summarizerLang: req.settings.summarizerLang });
    }
    
    if (req.settings.translatorTargetLang) {
      chrome.storage.local.set({ translatorTargetLang: req.settings.translatorTargetLang });
    }
    
    if (req.settings.autoTranslatorEnabled !== undefined) {
      chrome.storage.local.set({ autoTranslatorEnabled: req.settings.autoTranslatorEnabled });
    }
    
    chrome.storage.local.set({ 'aitools-visibility': elementVisibility });
  } else if (req.action === 'toggleDarkMode') {
    if (req.enabled) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  } else if (req.action === 'toggleExtension') {
    extensionEnabled = req.enabled;
  } else if (req.action === 'blockSponsored') {
    if (req.enabled) {
      blockSponsoredResults();
    }
  } else if (req.action === 'extractText') {
    // Extract visible text from page for summarization
    const text = document.body.innerText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 500)
      .slice(0, 100)
      .join(' ');
    
    sendResponse({ text: text || null });
    return true;
  }
  
  sendResponse({ status: 'ok' });
});

console.log('[AITools] Content script v4.0 ready');
