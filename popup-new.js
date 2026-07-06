  // ---- QUICK TAB ----
  document.getElementById('whatsappBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://whatsapp.com/channel/0029VbCJCg06GcG7aLZPGu1f' });
  });
  document.getElementById('discordBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://discord.gg/J2ssa2Wkjr' });
  });
  document.getElementById('about-meBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://djangogo33.github.io/about-me' });
  });
  document.getElementById('optitoolsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://djangogo33.github.io/optitools' });
  });
  document.getElementById('githubBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/djangogo33' });
  });

  document.getElementById('chatgptBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://chatgpt.com' });
  });

  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

  const blockSponsoredToggle = document.getElementById('blockSponsored');
  if (blockSponsoredToggle) {
    blockSponsoredToggle.addEventListener('change', (e) => {
    state.blockSponsoredEnabled = e.target.checked;
    chrome.storage.local.set({ blockSponsoredEnabled: e.target.checked });
      notifyActiveTab({ action: 'blockSponsored', enabled: e.target.checked });
      showToast(e.target.checked ? '✓ Pub bloquée' : '✗ Pub visible');
    });
  }

  // Cookie blocker quick toggle
  document.getElementById('cookieBlockerQuickToggle').addEventListener('change', (e) => {
    state.cookieBlockerEnabled = e.target.checked;
    chrome.storage.local.set({ cookieBlockerEnabled: e.target.checked });
    safeCheck('cookieBlockerEnabled', e.target.checked);
    notifyContentScript({ action: 'updateSettings', settings: { cookieBlockerEnabled: e.target.checked } });
    showToast(e.target.checked ? '✓ Cookies bloqués' : '✗ Bloqueur désactivé');
  });

  // ---- GOOGLE TAB ----
  document.getElementById('googleSearchBtn').addEventListener('click', () => {
    const query = document.getElementById('googleSearchInput').value.trim();
    if (!query) { showToast('⚠️ Entrez une recherche', 'error'); return; }
    chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
  });

  document.getElementById('googleSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (!query) return;
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
    }
  });

  // Category Buttons
  document.querySelectorAll('.category-badge').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      const query = document.getElementById('googleSearchInput').value.trim();
      if (!query) { showToast('⚠️ Entrez une recherche', 'error'); return; }

      const categoryMap = {
        'orthographe': 'https://www.google.com/search?q=correcteur+' + encodeURIComponent(query),
        'wiki': 'https://fr.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query),
        'trends': 'https://trends.google.com/trends/explore?q=' + encodeURIComponent(query),
        'news': 'https://news.google.com/search?q=' + encodeURIComponent(query),
        'images': 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&tbm=isch',
        'videos': 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&tbm=vid'
      };

      btn.classList.add('flash-success');
      setTimeout(() => btn.classList.remove('flash-success'), 200);
      chrome.tabs.create({ url: categoryMap[category] });
    });
  });

  // Filter operators
  document.querySelectorAll('.filter-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const operator = btn.dataset.operator;
      const input = document.getElementById('googleSearchInput');
      const needsValue = ['intitle:', 'inurl:', 'site:', 'filetype:', 'after:', 'before:', 'related:', '"', '-', 'imagesize:'];

      if (needsValue.includes(operator.trim())) {
        let value = '';
        if (operator === '"') {
          value = prompt('Terme exact à chercher :');
          if (value) input.value += ' "' + value + '"';
        } else if (operator === 'after:' || operator === 'before:') {
          value = prompt('Date (YYYY-MM-DD) :');
          if (value) input.value += ' ' + operator + value;
        } else if (operator === 'imagesize:') {
          value = prompt('Taille (ex: 800x600) :');
          if (value) input.value += ' ' + operator + value;
        } else {
          value = prompt('Valeur pour ' + operator + ' :');
          if (value) input.value += ' ' + operator + value;
        }
      } else {
        input.value += ' ' + operator.trim();
      }
      showToast('✓ Opérateur ajouté', 'success');
    });
  });

  // Google buttons visibility
  setupGoogleButtonToggle('googleButtonLucky', 'lucky');
  setupGoogleButtonToggle('googleButtonFilters', 'filters');
  setupGoogleButtonToggle('googleButtonMaps', 'maps');
  setupGoogleButtonToggle('googleButtonChatGPT', 'chatgpt');

  chrome.storage.local.get('googleButtonsVisibility', (result) => {
    const v = result.googleButtonsVisibility || { lucky: true, filters: true, maps: true, chatgpt: true };
    safeCheck('googleButtonLucky', v.lucky !== false);
    safeCheck('googleButtonFilters', v.filters !== false);
    safeCheck('googleButtonMaps', v.maps !== false);
    safeCheck('googleButtonChatGPT', v.chatgpt !== false);
  });

  setupGoogleButtonCustomizer();

  initTabNavigation();

  // ---- TOOLS TAB ----
  document.getElementById('pomodoroToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
      startPomodoro();
    } else {
      stopPomodoro();
      showToast('✗ Pomodoro arrêté');
    }
  });

  document.getElementById('tabCleanerToggle').addEventListener('change', (e) => {
    if (e.target.checked) { cleanupTabs(); showToast('✓ Onglets organisés', 'success'); }
  });

  document.getElementById('notesViewBtn').addEventListener('click', showNotesModal);
  document.getElementById('closeNotesBtn').addEventListener('click', () => {
    document.getElementById('notesModal').classList.add('hidden');
  });

  document.getElementById('clearNotesBtn').addEventListener('click', () => {
    if (confirm('⚠️ Effacer toutes les notes ?')) {
      state.notes = [];
      chrome.storage.local.set({ notes: [] });
      showToast('✓ Notes effacées', 'success');
    }
  });

  document.getElementById('summarizeBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { showToast('⚠️ Aucun onglet actif', 'error'); return; }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractText' }, (response) => {
        if (response && response.text) {
          const summary = summarizeText(response.text);
          const list = document.getElementById('notesList');
          list.innerHTML = `
            <div style="padding:12px;background:#f5f5f5;border-radius:4px;font-size:12px;line-height:1.6;">
              <strong>📋 Résumé :</strong>
              <p style="margin-top:8px;color:#333;">${summary}</p>
              <button id="popupCopySummary" style="margin-top:8px;background:#10b981;color:white;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:11px;">📋 Copier</button>
            </div>
          `;
          document.getElementById('notesModal').classList.remove('hidden');
          document.getElementById('popupCopySummary')?.addEventListener('click', () => {
            navigator.clipboard.writeText(summary).then(() => showToast('✓ Copié !', 'success'));
          });
        } else {
          showToast('⚠️ Impossible d\'extraire le texte', 'error');
        }
      }).catch(() => showToast('⚠️ Impossible d\'accéder à la page', 'error'));
    });
  });

  document.getElementById('anonymizeBtn').addEventListener('click', () => {
    const input = document.getElementById('anonymizeInput');
    const output = document.getElementById('anonymizeOutput');
    const summary = document.getElementById('anonymizeSummary');
    const copyBtn = document.getElementById('anonymizeCopyBtn');
    if (input) input.value = '';
    if (output) { output.value = ''; output.style.display = 'none'; }
    if (summary) summary.style.display = 'none';
    if (copyBtn) copyBtn.style.display = 'none';
    document.getElementById('anonymizeModal').classList.remove('hidden');
  });

  document.getElementById('anonymizeRunBtn').addEventListener('click', runAnonymizer);
  document.getElementById('anonymizeCopyBtn').addEventListener('click', () => {
    const output = document.getElementById('anonymizeOutput');
    if (output) navigator.clipboard.writeText(output.value).then(() => showToast('✓ Copié !', 'success'));
  });
  document.getElementById('anonymizeCloseBtn').addEventListener('click', () => {
    document.getElementById('anonymizeModal').classList.add('hidden');
  });

  // Improvement F: file import for anonymizer
  const anonymizeFileInput = document.getElementById('anonymizeFileInput');
  if (anonymizeFileInput) {
    anonymizeFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const input = document.getElementById('anonymizeInput');
        if (input) { input.value = ev.target.result; showToast('✓ Fichier chargé', 'success'); }
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  document.getElementById('pdfBtn').addEventListener('click', openPDFTools);
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  // Improvement G: markdown export
  const exportMdBtn = document.getElementById('exportDataMdBtn');
  if (exportMdBtn) exportMdBtn.addEventListener('click', exportDataMarkdown);

  // ---- AI TAB ----
  document.getElementById('aiDetectorBtn').addEventListener('click', detectAI);
  document.getElementById('translatorBtn').addEventListener('click', openTranslator);
  document.getElementById('paletteBtn').addEventListener('click', generatePalette);
  document.getElementById('youtubeBtn').addEventListener('click', openYouTubeEnhancer);

  document.getElementById('aiDetectorEnabled').addEventListener('change', (e) => {
    state.aiDetectorEnabled = e.target.checked;
    chrome.storage.local.set({ aiDetectorEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { aiDetectorEnabled: e.target.checked } });
    showToast(e.target.checked ? '✓ Détecteur IA activé' : '✗ Détecteur IA désactivé');
  });

  document.getElementById('summarizerEnabled').addEventListener('change', (e) => {
    state.summarizerEnabled = e.target.checked;
    chrome.storage.local.set({ summarizerEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { summarizerEnabled: e.target.checked } });
    showToast(e.target.checked ? '✓ Résumeur activé' : '✗ Résumeur désactivé');
  });

  document.getElementById('autoTranslatorEnabled').addEventListener('change', (e) => {
    state.autoTranslatorEnabled = e.target.checked;
    chrome.storage.local.set({ autoTranslatorEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { autoTranslatorEnabled: e.target.checked } });
    showToast(e.target.checked ? '✓ Traducteur activé' : '✗ Traducteur désactivé');
  });

  setupSelectSync('translatorTargetLang', 'translatorTargetLang', (v) => {
    notifyContentScript({ action: 'updateSettings', settings: { translatorTargetLang: v } });
  });

  setupSelectSync('summarizerLang', 'summarizerLang', (v) => {
    notifyContentScript({ action: 'updateSettings', settings: { summarizerLang: v } });
  });

  // AI Mode Selection
  setupSelectSync('aiMode', 'aiMode', (v) => {
    const modeName = v === 'free' ? '💰 Gratuit' : '🧠 IA Smart';
    showToast(`Mode: ${modeName}`);
  });

  // New AI Settings
  setupSlider('summarizerLength', 'summarizerLengthValue', 'summarizerLength');
  setupSlider('aiDetectorSensitivity', 'aiDetectorSensitivityValue', 'aiDetectorSensitivity');

  // Settings Tab - Same configuration but with different IDs
  setupSlider('summarizerLength-settings', 'summarizerLengthValue', 'summarizerLength');
  setupSlider('aiDetectorSensitivity-settings', 'aiDetectorSensitivityValue', 'aiDetectorSensitivity');
  setupSelectSync('translatorTargetLang-settings', 'translatorTargetLang', (v) => {
    notifyContentScript({ action: 'updateSettings', settings: { translatorTargetLang: v } });
  });
  setupSelectSync('summarizerLang-settings', 'summarizerLang', (v) => {
    notifyContentScript({ action: 'updateSettings', settings: { summarizerLang: v } });
  });

  // ---- SETTINGS TAB ----
  const layoutSelect = document.getElementById('layoutSelect');
  chrome.storage.local.get('aitools-layout', (data) => {
    if (data['aitools-layout'] && layoutSelect) layoutSelect.value = data['aitools-layout'];
  });
  if (layoutSelect) {
    layoutSelect.addEventListener('change', (e) => {
      const layout = e.target.value;
      chrome.storage.local.set({ 'aitools-layout': layout });
      notifyContentScript({ action: 'setLayout', layout });
      showToast('✓ Layout mis à jour', 'success');
    });
  }

  document.getElementById('resetLayoutBtn').addEventListener('click', () => {
    chrome.storage.local.set({ 'aitools-layout': 'adaptive', 'aitools-layout-custom': {} });
    if (layoutSelect) layoutSelect.value = 'adaptive';
    notifyContentScript({ action: 'resetLayout' });
    showToast('✓ Layout réinitialisé', 'success');
  });

  document.getElementById('resetPositionsBtn').addEventListener('click', () => {
    chrome.storage.local.get(null, (data) => {
      const keys = Object.keys(data).filter(k => k.includes('-pos') && k.includes('aitools'));
      if (keys.length > 0) chrome.storage.local.remove(keys);
    });
    notifyContentScript({ action: 'resetButtonPositions' });
    showToast('✓ Positions réinitialisées', 'success');
  });

  // Button visibility toggles
  document.querySelectorAll('.button-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const buttonType = e.target.dataset.buttonType;
      const isVisible = e.target.checked;
      if (!state.buttonVisibility) state.buttonVisibility = {};
      state.buttonVisibility[buttonType] = isVisible;
      chrome.storage.local.set({ buttonVisibility: state.buttonVisibility });
      notifyContentScript({ action: 'updateButtonVisibility', buttonType, isVisible });
      showToast(isVisible ? '✓ Affiché' : '✗ Masqué');
    });
  });

  // Cookie blocker settings tab
  document.getElementById('cookieBlockerEnabled').addEventListener('change', (e) => {
    state.cookieBlockerEnabled = e.target.checked;
    chrome.storage.local.set({ cookieBlockerEnabled: e.target.checked });
    safeCheck('cookieBlockerQuickToggle', e.target.checked);
    notifyContentScript({ action: 'updateSettings', settings: { cookieBlockerEnabled: e.target.checked } });
    showToast(e.target.checked ? '✓ Bloqueur cookies actif' : '✗ Bloqueur désactivé');
  });

  document.getElementById('readingTimeToggle').addEventListener('change', (e) => {
    state.readingTimeEnabled = e.target.checked;
    chrome.storage.local.set({ readingTimeEnabled: e.target.checked });
    showToast(e.target.checked ? '✓ Temps de lecture actif' : '✗ Désactivé');
  });

  document.getElementById('currencyConverterToggle').addEventListener('change', (e) => {
    state.currencyConverterEnabled = e.target.checked;
    chrome.storage.local.set({ currencyConverterEnabled: e.target.checked });
  });

  document.getElementById('performanceModeEnabled').addEventListener('change', (e) => {
    state.performanceModeEnabled = e.target.checked;
    chrome.storage.local.set({ performanceModeEnabled: e.target.checked });
    notifyContentScript({ action: 'togglePerformanceMode', enabled: e.target.checked });
    showToast(e.target.checked ? '✓ Mode performance' : '✗ Mode standard');
  });

  // Newtab URL
  const newtabPreset = document.getElementById('newtabUrlPreset');
  const newtabCustom = document.getElementById('newtabUrlCustom');
  if (newtabPreset) {
    chrome.storage.local.get(['newtabUrlPreset', 'newtabUrlCustom'], (data) => {
      const preset = data.newtabUrlPreset || 'google';
      newtabPreset.value = preset;
      if (preset === 'custom' && newtabCustom) {
        newtabCustom.style.display = 'block';
        if (data.newtabUrlCustom) newtabCustom.value = data.newtabUrlCustom;
      }
    });
    newtabPreset.addEventListener('change', (e) => {
      chrome.storage.local.set({ newtabUrlPreset: e.target.value });
      if (newtabCustom) newtabCustom.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    if (newtabCustom) {
      newtabCustom.addEventListener('input', (e) => {
        chrome.storage.local.set({ newtabUrlCustom: e.target.value });
      });
    }
  }

  document.getElementById('resetBtn').addEventListener('click', resetExtension);

  // ============================================================================
  // DIAGNOSTIC TAB - Prompt API Status Check
  // ============================================================================
  async function updateDiagnosticStatus() {
    console.log('[Diagnostic] Checking Prompt API status...');
    
    const apiStatusEl = document.getElementById('apiStatus');
    const geminiStatusEl = document.getElementById('geminiStatus');
    const chromeVersionEl = document.getElementById('chromeVersion');
    
    // Get Chrome version from navigator
    const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 'Unknown';
    chromeVersionEl.textContent = chromeVersion >= 129 ? `✅ ${chromeVersion}` : `❌ ${chromeVersion} (besoin 129+)`;
    
    // Check if AIService is available and API is working
    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab.length > 0) {
      try {
        const response = await chrome.tabs.sendMessage(activeTab[0].id, {
          action: 'checkPromptAPI'
        });
        
        if (response && response.apiAvailable) {
          apiStatusEl.textContent = '✅ Disponible';
          geminiStatusEl.textContent = '✅ Accessible';
        } else {
          apiStatusEl.textContent = '❌ Indisponible';
          geminiStatusEl.textContent = response?.reason || '⚠️ Vérifiez chrome://flags';
        }
      } catch (err) {
        console.warn('[Diagnostic] Message to content script failed:', err.message);
        apiStatusEl.textContent = '❓ Impossible à vérifier';
        geminiStatusEl.textContent = '❓ Rafraîchissez la page';
      }
    }
  }
  
  // Initial diagnostic check
  updateDiagnosticStatus();
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshDiagnosticBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Vérification...';
      updateDiagnosticStatus();
      setTimeout(() => {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Vérifier maintenant';
      }, 2000);
    });
  }
  
  // Open Chrome version
  const versionBtn = document.getElementById('openChromeVersionBtn');
  if (versionBtn) {
    versionBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://version' });
    });
  }
  
  // Open Chrome flags
  const flagsBtn = document.getElementById('openChromeUrlsBtn');
  if (flagsBtn) {
    flagsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://flags#prompt-api-for-gemini-nano' });
    });
  }

  // Load notes
  chrome.storage.local.get('notes', (data) => {
    if (data.notes) state.notes = data.notes;
  });

  // Storage change listener
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.darkMode) state.darkMode = changes.darkMode.newValue;
    if (changes.notes) {
      state.notes = changes.notes.newValue || [];
      const modal = document.getElementById('notesModal');
      if (modal && !modal.classList.contains('hidden')) showNotesModal();
    }
    updateUI();
  });

// ============================================================================
// HELPERS
// ============================================================================
function setupSlider(sliderId, valueId, storageKey) {
  const slider = document.getElementById(sliderId);
  const valueEl = document.getElementById(valueId);
  if (!slider) return;
  chrome.storage.local.get(storageKey, (data) => {
    if (data[storageKey] !== undefined) {
      slider.value = data[storageKey];
      if (valueEl) valueEl.textContent = data[storageKey];
    }
  });
  slider.addEventListener('input', (e) => {
    if (valueEl) valueEl.textContent = e.target.value;
    chrome.storage.local.set({ [storageKey]: parseInt(e.target.value) });
    notifyContentScript({ action: 'updateSettings', settings: { [storageKey]: parseInt(e.target.value) } });
  });
}

function setupSelectSync(elementId, storageKey, callback) {
  const el = document.getElementById(elementId);
  if (!el) return;
  chrome.storage.local.get(storageKey, (data) => {
    if (data[storageKey]) el.value = data[storageKey];
  });
  el.addEventListener('change', (e) => {
    chrome.storage.local.set({ [storageKey]: e.target.value });
    if (callback) callback(e.target.value);
  });
}

function setupGoogleButtonToggle(elementId, key) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.addEventListener('change', (e) => {
    chrome.storage.local.get('googleButtonsVisibility', (result) => {
      const v = result.googleButtonsVisibility || { lucky: true, filters: true, maps: true, chatgpt: true };
      v[key] = e.target.checked;
      chrome.storage.local.set({ googleButtonsVisibility: v });
      notifyContentScript({ action: 'updateGoogleButtons', visibility: v });
      showToast(e.target.checked ? `✓ Bouton ${key} visible` : `✗ Bouton ${key} masqué`);
    });
  });
}

function updateHeaderStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const statusEl = document.getElementById('headerSiteStatus');
    if (!statusEl) return;
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        statusEl.textContent = url.hostname || 'Prêt';
      } catch { statusEl.textContent = 'Prêt'; }
    } else { statusEl.textContent = 'Prêt'; }
  });
}

function updateUI() {
  safeCheck('darkModeToggle', state.darkMode);
  safeCheck('blockSponsored', state.blockSponsoredEnabled);
  safeCheck('pomodoroToggle', state.pomodoroRunning);
  safeCheck('readingTimeToggle', state.readingTimeEnabled);
  safeCheck('currencyConverterToggle', state.currencyConverterEnabled);
  safeCheck('aiDetectorEnabled', state.aiDetectorEnabled);
  safeCheck('summarizerEnabled', state.summarizerEnabled);
  safeCheck('autoTranslatorEnabled', state.autoTranslatorEnabled);
  safeCheck('performanceModeEnabled', state.performanceModeEnabled);
  safeCheck('cookieBlockerEnabled', state.cookieBlockerEnabled);
  safeCheck('cookieBlockerQuickToggle', state.cookieBlockerEnabled);

  const bv = state.buttonVisibility || {};
  safeCheck('googleButtonsVisible', bv.googleButtons !== false);
  safeCheck('summarizerButtonVisible', bv.summarizerButton !== false);
  safeCheck('aiDetectorBadgeVisible', bv.aiDetectorBadge !== false);
  safeCheck('translationButtonsVisible', bv.translationButtons !== false);
  safeCheck('quickStatsWidgetVisible', bv.quickStatsWidget !== false);
  safeCheck('focusModeBadgeVisible', bv.focusModeBadge !== false);
  safeCheck('readingTimeBadgeVisible', bv.readingTimeBadge !== false);
  safeCheck('notesHighlighterVisible', bv.notesHighlighter !== false);

  document.body.classList.toggle('dark-mode', !!state.darkMode);
  document.body.classList.toggle('extension-disabled', !state.extensionEnabled);
}

function safeCheck(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = !!value;
}

function initTabNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab');

  if (!navButtons.length || !tabs.length) return;

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      if (!tabId) return;

      navButtons.forEach((b) => b.classList.toggle('active', b === btn));
      tabs.forEach((tab) => tab.classList.toggle('active', tab.id === tabId));
    });
  });
}

// ============================================================================
// DARK MODE
// ============================================================================
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  chrome.storage.local.set({ darkMode: state.darkMode });
  document.body.classList.toggle('dark-mode', state.darkMode);
  safeCheck('darkModeToggle', state.darkMode);
  notifyContentScript({ action: 'toggleDarkMode', enabled: state.darkMode });
  showToast(state.darkMode ? '🌙 Mode sombre' : '☀️ Mode clair');
}

// ============================================================================
// EXTENSION TOGGLE
// ============================================================================
function toggleExtension() {
  state.extensionEnabled = !state.extensionEnabled;
  chrome.storage.local.set({ extensionEnabled: state.extensionEnabled });
  const btn = document.getElementById('toggleExtension');
  if (btn) {
    btn.style.opacity = state.extensionEnabled ? '1' : '0.5';
    btn.textContent = state.extensionEnabled ? '✓' : '✗';
  }
  document.body.classList.toggle('extension-disabled', !state.extensionEnabled);
  notifyContentScript({ action: 'toggleExtension', enabled: state.extensionEnabled });
  showToast(state.extensionEnabled ? '✓ Extension activée' : '✗ Extension désactivée');
}

// ============================================================================
// DISABLE ALL
// ============================================================================
function disableAll() {
  const allSettings = {
    aiDetectorEnabled: false, summarizerEnabled: false, autoTranslatorEnabled: false,
    readingTimeEnabled: false, blockSponsoredEnabled: false, cookieBlockerEnabled: false,
    googleButtonsVisibility: { lucky: false, filters: false, maps: false, chatgpt: false }
  };
  chrome.storage.local.set(allSettings);
  state = { ...state, ...allSettings };
  updateUI();
  notifyContentScript({ action: 'updateSettings', settings: allSettings });
  showToast('⊘ Tout désactivé');
}

// ============================================================================
// POMODORO — Improvement H: persist state via chrome.storage.session
// ============================================================================
let pomodoroTimer = null;

function checkPomodoroResume() {
  if (!chrome.storage.session) return;
  chrome.storage.session.get(['pomodoroStartTime', 'pomodoroDuration'], (data) => {
    if (data.pomodoroStartTime) {
      const elapsed = Date.now() - data.pomodoroStartTime;
      if (elapsed < data.pomodoroDuration) {
        safeCheck('pomodoroToggle', true);
        state.pomodoroRunning = true;
        runPomodoroTimer(data.pomodoroStartTime, data.pomodoroDuration);
      } else {
        if (chrome.storage.session) chrome.storage.session.remove(['pomodoroStartTime', 'pomodoroDuration']);
      }
    }
  });
}

function startPomodoro() {
  const startTime = Date.now();
  const duration = 25 * 60 * 1000;
  state.pomodoroRunning = true;
  if (chrome.storage.session) {
    chrome.storage.session.set({ pomodoroStartTime: startTime, pomodoroDuration: duration });
  }
  runPomodoroTimer(startTime, duration);
  showToast('⏱️ Pomodoro démarré', 'success');
}

function stopPomodoro() {
  state.pomodoroRunning = false;
  if (pomodoroTimer) { clearTimeout(pomodoroTimer); pomodoroTimer = null; }
  if (chrome.storage.session) chrome.storage.session.remove(['pomodoroStartTime', 'pomodoroDuration']);
  const status = document.getElementById('pomodoroStatus');
  if (status) status.style.display = 'none';
}

function runPomodoroTimer(startTime, duration) {
  const status = document.getElementById('pomodoroStatus');
  if (status) status.style.display = 'block';

  const tick = () => {
    const remaining = Math.max(0, Math.floor((duration - (Date.now() - startTime)) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (status) status.innerHTML = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;

    if (remaining > 0) {
      pomodoroTimer = setTimeout(tick, 1000);
    } else {
      if (status) status.innerHTML = '✅ Terminé !';
      safeCheck('pomodoroToggle', false);
      state.pomodoroRunning = false;
      if (chrome.storage.session) chrome.storage.session.remove(['pomodoroStartTime', 'pomodoroDuration']);
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/logo aitools sans fond sans texte.png',
          title: '⏱️ Pomodoro',
          message: "C'est l'heure de la pause !"
        });
      } catch {}
    }
  };
  tick();
}

// ============================================================================
// TAB CLEANER
// ============================================================================
function cleanupTabs() {
  chrome.tabs.query({}, (tabs) => {
    const grouped = {};
    tabs.forEach(tab => {
      try {
        const domain = new URL(tab.url).hostname || 'unknown';
        if (!grouped[domain]) grouped[domain] = [];
        grouped[domain].push(tab);
      } catch {}
    });
    Object.values(grouped).forEach(group => {
      if (group.length > 1) {
        try { chrome.tabGroups.group({ tabIds: group.slice(1).map(t => t.id) }); } catch {}
      }
    });
  });
}

// ============================================================================
// NOTES
// ============================================================================
function showNotesModal() {
  const modal = document.getElementById('notesModal');
  const list = document.getElementById('notesList');
  if (state.notes.length === 0) {
    list.innerHTML = '<p style="color:#999;font-size:12px;">Pas de notes. Surlignez un texte sur une page !</p>';
  } else {
    list.innerHTML = state.notes.map((note, i) => `
      <div style="padding:8px;background:#f5f5f5;border-radius:4px;margin-bottom:6px;font-size:11px;word-break:break-word;">
        <strong>${note.title || 'Note'}</strong>
        <p style="margin-top:4px;color:#666;">"${note.text}"</p>
        <button onclick="deleteNote(${i})" style="background:#ef4444;color:white;border:none;padding:3px 8px;border-radius:3px;font-size:10px;cursor:pointer;margin-top:4px;">Supprimer</button>
      </div>
    `).join('');
  }
  modal.classList.remove('hidden');
}

function deleteNote(index) {
  state.notes.splice(index, 1);
  chrome.storage.local.set({ notes: state.notes });
  showNotesModal();
}
window.deleteNote = deleteNote;

// ============================================================================
// ANONYMIZER — Bug #5 fix: no lookbehind, safer name detection
// ============================================================================
function runAnonymizer() {
  const inputEl = document.getElementById('anonymizeInput');
  const input = inputEl?.value || '';
  if (!input.trim()) { showToast('⚠️ Collez du texte', 'error'); return; }

  const counts = {};
  let result = input;

  const rules = [
    { key: 'URL', pattern: /https?:\/\/[^\s]+/g, label: '[URL]' },
    { key: 'Email', pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, label: '[EMAIL]' },
    { key: 'IBAN', pattern: /\b[A-Z]{2}\d{2}[\sA-Z0-9]{11,30}\b/g, label: '[IBAN]' },
    { key: 'NSS', pattern: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g, label: '[NSS]' },
    { key: 'IP', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: '[IP]' },
    { key: 'Téléphone', pattern: /(?:\+33|0033|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/g, label: '[TÉLÉPHONE]' },
    { key: 'Date', pattern: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, label: '[DATE]' },
    { key: 'Code postal', pattern: /\b(?:0[1-9]|[1-8]\d|9[0-5])\d{3}\b/g, label: '[CODE POSTAL]' },
  ];

  rules.forEach(({ key, pattern, label }) => {
    const matches = result.match(pattern) || [];
    if (matches.length > 0) { counts[key] = matches.length; result = result.replace(pattern, label); }
  });

  // Bug #5 fix: replace unsafe lookbehind with title-based + consecutive-capitals approach
  // Step 1: title + name (M. Paul Dupont, Dr Marie Martin...)
  const titlePattern = /\b(M\.|Mme\.?|Dr\.?|Pr\.?|Prof\.?|Monsieur|Madame|Ma[îi]tre|Docteur)\s+([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][a-zàâéèêëîïôùûüç\-]{1,}(?:\s+[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][a-zàâéèêëîïôùûüç\-]{1,})*)/g;
  const titleMatches = result.match(titlePattern) || [];
  if (titleMatches.length > 0) {
    counts['Nom'] = (counts['Nom'] || 0) + titleMatches.length;
    result = result.replace(titlePattern, '[NOM]');
  }

  // Step 2: two consecutive capitalized words (Prénom Nom pattern)
  const namePattern = /\b([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][a-zàâéèêëîïôùûüç\-]{2,})\s+([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][a-zàâéèêëîïôùûüç\-]{2,})\b/g;
  const nameMatches = result.match(namePattern) || [];
  if (nameMatches.length > 0) {
    counts['Nom'] = (counts['Nom'] || 0) + nameMatches.length;
    result = result.replace(namePattern, '[NOM]');
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const summaryEl = document.getElementById('anonymizeSummary');
  const outputEl = document.getElementById('anonymizeOutput');
  const copyBtn = document.getElementById('anonymizeCopyBtn');

  if (summaryEl) {
    summaryEl.style.display = 'block';
    if (totalCount === 0) {
      summaryEl.innerHTML = 'ℹ️ Aucune donnée personnelle détectée.';
      summaryEl.style.cssText = summaryEl.style.cssText + ';background:#fef9e7;border-color:#f9e79f;color:#856404;';
    } else {
      const details = Object.entries(counts).map(([k, v]) => `<strong>${k}</strong>: ${v}`).join(' · ');
      summaryEl.innerHTML = `✅ <strong>${totalCount} élément(s) anonymisé(s)</strong><br><span style="opacity:0.8;">${details}</span>`;
      summaryEl.style.cssText = summaryEl.style.cssText + ';background:#f0fdf4;border-color:#bbf7d0;color:#166534;';
    }
  }

  if (outputEl) { outputEl.value = result; outputEl.style.display = 'block'; }
  if (copyBtn) copyBtn.style.display = totalCount > 0 ? 'block' : 'none';
  showToast(`✓ ${totalCount} élément(s) anonymisé(s)`, 'success');
}

// ============================================================================
// GOOGLE BUTTON CUSTOMIZER
// ============================================================================
const defaultButtonConfigs = {
  lucky: { label: '🍀 Chance', action: 'lucky', color: '#5f6368' },
  filters: { label: '🔍 Filtres', action: 'filters', color: '#5f6368' },
  maps: { label: '🗺️ Maps', action: 'maps', color: '#5f6368' },
  chatgpt: { label: '🤖 ChatGPT', action: 'chatgpt', color: '#5f6368' }
};

function setupGoogleButtonCustomizer() {
  const sel = document.getElementById('googleButtonCustomizeSelect');
  const view = document.getElementById('googleButtonCustomizeView');
  const labelInput = document.getElementById('googleButtonCustomizeLabel');
  const colorInput = document.getElementById('googleButtonCustomizeColor');
  const actionInput = document.getElementById('googleButtonCustomizeAction');
  const resetBtn = document.getElementById('googleButtonCustomizeReset');
  if (!sel) return;

  sel.addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) { if (view) view.style.display = 'none'; return; }
    chrome.storage.local.get('googleButtonsConfig', (result) => {
      const config = result.googleButtonsConfig || {};
      const btnCfg = config[key] || defaultButtonConfigs[key];
      if (labelInput) labelInput.value = btnCfg.label;
      if (colorInput) colorInput.value = btnCfg.color;
      if (actionInput) actionInput.value = btnCfg.action;
      if (view) view.style.display = 'block';
    });
  });

  const saveConfig = () => {
    const key = sel.value;
    if (!key) return;
    chrome.storage.local.get('googleButtonsConfig', (result) => {
      const config = result.googleButtonsConfig || {};
      config[key] = {
        label: labelInput?.value || defaultButtonConfigs[key].label,
        color: colorInput?.value || defaultButtonConfigs[key].color,
        action: actionInput?.value || defaultButtonConfigs[key].action
      };
      chrome.storage.local.set({ googleButtonsConfig: config });
      notifyContentScript({ action: 'updateGoogleButtons', config });
      showToast('✓ Bouton mis à jour', 'success');
    });
  };

  if (labelInput) labelInput.addEventListener('blur', saveConfig);
  if (colorInput) colorInput.addEventListener('change', saveConfig);
  if (actionInput) actionInput.addEventListener('change', saveConfig);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const key = sel.value;
      if (!key) return;
      chrome.storage.local.get('googleButtonsConfig', (result) => {
        const config = result.googleButtonsConfig || {};
        config[key] = { ...defaultButtonConfigs[key] };
        chrome.storage.local.set({ googleButtonsConfig: config });
        if (labelInput) labelInput.value = defaultButtonConfigs[key].label;
        if (colorInput) colorInput.value = defaultButtonConfigs[key].color;
        if (actionInput) actionInput.value = defaultButtonConfigs[key].action;
        notifyContentScript({ action: 'updateGoogleButtons', config });
        showToast('↺ Bouton réinitialisé');
      });
    });
  }
}

// ============================================================================
// AI DETECTOR (popup version — manual text input)
// ============================================================================
function detectAI() {
  const text = prompt('🤖 Collez le texte à analyser :');
  if (!text || text.trim().length < 50) { showToast('⚠️ Texte trop court (min 50 car.)', 'error'); return; }

  const passiveCount = (text.match(/(\bwas\b|\bwere\b|\bbeing\b)/gi) || []).length;
  const formalCount = (text.match(/(\bthus\b|\btherefore\b|\bmoreover\b|\bfurthermore\b)/gi) || []).length;
  const structureCount = (text.match(/(\.\s[A-Z][a-z]{3,})/g) || []).length;
  const wordCount = Math.max(1, text.split(/\s+/).length);

  const score = Math.min(100, Math.round(
    (passiveCount / wordCount * 100) * 0.3 +
    (structureCount / Math.max(1, text.split('.').length) * 100) * 0.4 +
    (formalCount / Math.max(1, wordCount) * 1000) * 0.3
  ));

  let result = `📊 Analyse IA :\n\nScore : ${score}%\n`;
  result += `\n• Tournures passives : ${passiveCount}`;
  result += `\n• Connecteurs formels : ${formalCount}`;
  result += `\n• Structure répétitive : ${structureCount}`;
  result += `\n\n${score > 60 ? '❌ Forte probabilité de contenu IA' : score > 30 ? '🟡 Probabilité modérée' : '✅ Probablement humain'}`;
  alert(result);
}

// ============================================================================
// TRANSLATOR (popup version)
// ============================================================================
function openTranslator() {
  const text = prompt('🌐 Texte à traduire :');
  if (!text?.trim()) return;
  chrome.tabs.create({ url: `https://translate.google.com/?text=${encodeURIComponent(text.substring(0, 500))}&op=translate` });
}

// ============================================================================
// PALETTE GENERATOR
// ============================================================================
function generatePalette() {
  const colors = Array.from({ length: 5 }, () => {
    const h = Math.random() * 360;
    const s = 60 + Math.random() * 30;
    const l = 45 + Math.random() * 30;
    return hslToHex(h, s, l);
  });

  const list = document.getElementById('notesList');
  list.innerHTML = '<div style="font-size:11px;"><strong>🎨 Palette générée :</strong><br><br>' +
    colors.map(c => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px;background:#f5f5f5;border-radius:4px;">
        <div style="width:36px;height:36px;background:${c};border-radius:4px;border:1px solid #ddd;flex-shrink:0;"></div>
        <code style="font-size:11px;">${c}</code>
        <button onclick="navigator.clipboard.writeText('${c}')" style="font-size:10px;padding:2px 6px;border:1px solid #ddd;border-radius:3px;cursor:pointer;background:white;">Copier</button>
      </div>
    `).join('') + '</div>';
  document.getElementById('notesModal').classList.remove('hidden');
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(255 * x).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ============================================================================
// YOUTUBE ENHANCER
// ============================================================================
function openYouTubeEnhancer() {
  const list = document.getElementById('notesList');
  list.innerHTML = `
    <div style="font-size:11px;line-height:1.6;">
      <strong>▶️ YouTube Enhancer</strong><br><br>
      <ul style="margin:8px 0;padding-left:16px;">
        <li>⏩ Contrôle vitesse (0.5x – 2x)</li>
        <li>🎯 Picture-in-Picture</li>
        <li>📊 Stats vidéo avancées</li>
      </ul>
      <button onclick="chrome.tabs.create({url:'https://www.youtube.com'})"
        style="background:#ff0000;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px;margin-top:8px;">
        Aller sur YouTube
      </button>
    </div>
  `;
  document.getElementById('notesModal').classList.remove('hidden');
}

// ============================================================================
// PDF TOOLS
// ============================================================================
function openPDFTools() {
  const list = document.getElementById('notesList');
  list.innerHTML = `
    <div style="font-size:11px;line-height:1.6;">
      <strong>📄 PDF Tools</strong><br><br>
      <ul style="margin:8px 0;padding-left:16px;">
        <li>✂️ Extraire texte des PDF</li>
        <li>🔍 Chercher dans les PDFs</li>
      </ul>
      <p style="color:#999;font-size:10px;">Ouvrez un PDF dans votre navigateur !</p>
      <input type="file" id="pdfInput" accept=".pdf" style="font-size:11px;margin-top:8px;">
      <button id="extractPdfBtn" style="background:#4CAF50;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;margin-top:6px;display:block;">Extraire texte</button>
    </div>
  `;
  document.getElementById('notesModal').classList.remove('hidden');
  document.getElementById('extractPdfBtn')?.addEventListener('click', () => {
    showToast('📄 Fonctionnalité en développement');
  });
}

// ============================================================================
// EXPORT DATA — JSON + Improvement G: Markdown
// ============================================================================
function exportData() {
  const data = { notes: state.notes, timestamp: new Date().toISOString(), version: '4.0' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `aitools-export-${Date.now()}.json`; a.click();
  showToast('✓ Export JSON réalisé', 'success');
}

function exportDataMarkdown() {
  if (!state.notes.length) { showToast('⚠️ Pas de notes à exporter', 'error'); return; }
  const lines = state.notes.map(n => {
    const date = n.timestamp ? new Date(n.timestamp).toLocaleDateString('fr-FR') : '';
    return `## ${n.title || 'Note'}\n\n> ${n.text}\n\n*Source : ${n.url}*  \n*${date}*`;
  });
  const md = `# Mes notes AITools\n\n${lines.join('\n\n---\n\n')}`;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `aitools-notes-${Date.now()}.md`; a.click();
  showToast('✓ Export Markdown réalisé', 'success');
}

// ============================================================================
// RESET
// ============================================================================
function resetExtension() {
  if (!confirm('⚠️ Réinitialiser toutes les données ?')) return;
  chrome.storage.local.clear(() => {
    state = {
      darkMode: false, extensionEnabled: true, pomodoroRunning: false,
      readingTimeEnabled: true, currencyConverterEnabled: false,
      blockSponsoredEnabled: false, notes: [], buttonVisibility: {}
    };
    updateUI();
    showToast('✓ Extension réinitialisée', 'success');
  });
}

// ============================================================================
// SUMMARIZE (popup version)
// ============================================================================
function summarizeText(text) {
  if (!text || text.length < 100) return text;
  let sentences = (text.match(/[^.!?]+[.!?]+/g) || [text]).map(s => s.trim()).filter(s => s.length > 20);
  if (sentences.length <= 2) return text;

  const keywords = {
    'important': 4, 'clé': 4, 'essentiel': 4, 'résultat': 4, 'conclusion': 4,
    'découvert': 4, 'impact': 4, 'key': 4, 'result': 4, 'found': 3, 'shows': 3
  };

  const scored = sentences.map((s, i) => {
    let score = 1;
    if (i === 0) score += 5;
    if (i === sentences.length - 1) score += 4;
    const wc = s.split(/\s+/).length;
    if (wc >= 8 && wc <= 30) score += 3;
    Object.entries(keywords).forEach(([kw, w]) => { if (s.toLowerCase().includes(kw)) score += w; });
    if (/\d+/.test(s)) score += 2;
    return { s, score, i };
  });

  const keepCount = Math.max(2, Math.ceil(sentences.length * 0.35));
  return scored.sort((a, b) => b.score - a.score).slice(0, keepCount)
    .sort((a, b) => a.i - b.i).map(x => x.s).join(' ');
}

// ============================================================================
// AUTHENTICATION - PROFILE TAB
// ============================================================================

// Charger et afficher le profil utilisateur au démarrage
async function loadUserProfile() {
  try {
    chrome.runtime.sendMessage({ action: 'auth-get-user' }, (response) => {
      if (response?.user) {
        displayUserProfile(response.user, response.plan);
      } else {
        displayLoginPrompt();
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    displayLoginPrompt();
  }
}

// Afficher la section de connexion
function displayLoginPrompt() {
  const authStatus = document.getElementById('auth-status');
  authStatus.innerHTML = `
    <div class="auth-login-wrap">
      <div class="auth-login-title">
        Connectez-vous pour débloquer les fonctionnalités PRO
      </div>
      <button id="login-google-btn" class="login-btn">
        🔑 Se connecter avec Google
      </button>
    </div>
  `;
  
  const connectedSection = document.getElementById('user-connected-section');
  connectedSection?.classList.add('is-hidden');
  connectedSection?.classList.remove('is-visible');
  
  // Attacher l'événement au bouton de connexion
  const loginBtn = document.getElementById('login-google-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      loginWithGoogle();
    });
  }
}

// Afficher le profil utilisateur
function displayUserProfile(user, plan) {
  // Remplir les infos du profil
  document.getElementById('profile-name').textContent = user.name || 'Utilisateur';
  document.getElementById('profile-email').textContent = user.email || 'email@example.com';
  
  // Mettre à jour le badge du plan
  const planBadge = document.getElementById('plan-badge');
  const planLower = (plan.plan || 'free').toLowerCase();
  planBadge.textContent = plan.plan || 'free';
  planBadge.className = `plan-badge ${planLower}`;
  
  // Afficher la date d'expiration si active
  const expiryDiv = document.getElementById('plan-expiry');
  if (plan.expiryDate) {
    const expiryDate = new Date(plan.expiryDate);
    const days = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      expiryDiv.textContent = `Expire dans ${days} jour${days > 1 ? 's' : ''}`;
    } else if (days === 0) {
      expiryDiv.textContent = 'Expire aujourd\'hui';
    }
  }
  
  // Afficher les boutons d'upgrade selon le plan
  const upgradeDiv = document.getElementById('upgrade-buttons');
  upgradeDiv.innerHTML = '';
  
  if (plan.plan === 'free') {
    upgradeDiv.innerHTML = `
      <button class="upgrade-btn upgrade-btn-pro" onclick="openStripeCheckout('pro', '${user.id}')">
        ⭐ Upgrade PRO - 4.99€/mois
      </button>
      <button class="upgrade-btn upgrade-btn-max" onclick="openStripeCheckout('max', '${user.id}')">
        👑 Upgrade MAX - 9.99€/mois
      </button>
    `;
  } else if (plan.plan === 'pro') {
    upgradeDiv.innerHTML = `
      <button class="upgrade-btn upgrade-btn-max" onclick="openStripeCheckout('max', '${user.id}')">
        👑 Upgrade MAX - 9.99€/mois
      </button>
      <button class="manage-btn" onclick="manageSubscription()">
        💳 Gérer l'abonnement
      </button>
    `;
  } else if (plan.plan === 'MAX') {
    upgradeDiv.innerHTML = `
      <button class="manage-btn" onclick="manageSubscription()">
        💳 Gérer l'abonnement
      </button>
    `;
  }
  
  // Afficher la section utilisateur connecté
  const connectedSection = document.getElementById('user-connected-section');
  connectedSection?.classList.remove('is-hidden');
  connectedSection?.classList.add('is-visible');
  document.getElementById('auth-status').innerHTML = '';
  
  // Attacher les événements
  setupProfileEventListeners();
}

// Configurer les événements de la section profil
function setupProfileEventListeners() {
  // Bouton appliquer code promo
  const applyPromoBtn = document.getElementById('apply-promo-btn');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', applyPromoCode);
  }
  
  // Bouton logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
  
  // Entrée code promo - touche Entrée
  const promoInput = document.getElementById('promo-code-input');
  if (promoInput) {
    promoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyPromoCode();
      }
    });
  }
}

// Connexion avec Google
function loginWithGoogle() {
  const loginBtn = document.getElementById('login-google-btn');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Connexion en cours...';
  }
  
  chrome.runtime.sendMessage({ action: 'auth-login-google' }, (response) => {
    if (response?.success) {
      showToast('✅ Connexion réussie!', 'success');
      loadUserProfile();
    } else {
      showToast(`❌ Erreur: ${response?.error || 'Connexion échouée'}`, 'error');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔑 Se connecter avec Google';
      }
    }
  });
}

// Appliquer un code promo
function applyPromoCode() {
  const promoInput = document.getElementById('promo-code-input');
  const promoCode = promoInput?.value?.trim();
  const promoMessage = document.getElementById('promo-message');
  const setPromoState = (stateClass, text) => {
    if (!promoMessage) return;
    promoMessage.classList.remove('promo-message-success', 'promo-message-error');
    if (stateClass) promoMessage.classList.add(stateClass);
    promoMessage.textContent = text || '';
  };
  
  if (!promoCode) {
    showToast('⚠️ Entrez un code promo', 'error');
    setPromoState('promo-message-error', 'Entrez un code promo');
    return;
  }
  
  const applyBtn = document.getElementById('apply-promo-btn');
  applyBtn.disabled = true;
  applyBtn.textContent = '...';
  
  chrome.runtime.sendMessage({
    action: 'auth-apply-promo',
    code: promoCode
  }, (response) => {
    applyBtn.disabled = false;
    applyBtn.textContent = '✓';

    if (chrome.runtime.lastError) {
      const channelError = chrome.runtime.lastError.message || 'Erreur de communication';
      showToast(`❌ ${channelError}`, 'error');
      setPromoState('promo-message-error', channelError);
      return;
    }
    
    if (response?.success) {
      showToast('✅ Code promo appliqué!', 'success');
      promoInput.value = '';
      setPromoState('promo-message-success', `Code appliqué: ${promoCode}`);
      // Recharger le profil après 1s
      setTimeout(loadUserProfile, 1000);
    } else {
      showToast(`❌ ${response?.error || 'Code invalide'}`, 'error');
      setPromoState('promo-message-error', response?.error || 'Code promo invalide ou expiré');
    }
  });
}

// Déconnexion
function logoutUser() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
    chrome.runtime.sendMessage({ action: 'auth-logout' }, (response) => {
      if (response?.success) {
        showToast('✅ Déconnexion réussie', 'success');
        setTimeout(() => {
          displayLoginPrompt();
        }, 500);
      } else {
        showToast('❌ Erreur lors de la déconnexion', 'error');
      }
    });
  }
}

// Ouvrir Stripe Checkout
function openStripeCheckout(plan, userId) {
  // À remplacer par l'URL réelle de Stripe Checkout
  const stripeUrl = `https://aitools-admin.netlify.app/checkout?plan=${plan}&customer=${userId}`;
  chrome.tabs.create({ url: stripeUrl });
}

// Gérer l'abonnement (redirection vers Stripe portal)
function manageSubscription() {
  const manageUrl = 'https://billing.stripe.com/p/login/00g';
  chrome.tabs.create({ url: manageUrl });
}

// Charger le profil au démarrage
// (Dans le listener DOMContentLoaded existant)

// ============================================================================
// GUARDRAILS - FEATURE LOCKING SYSTEM
// ============================================================================

let currentUserPlan = 'FREE';
let featureAccessMap = {};

// Initialiser le système de verrous
async function initializeFeatureLocks() {
  try {
    chrome.runtime.sendMessage({ action: 'auth-get-user' }, async (response) => {
      if (response?.user) {
        currentUserPlan = response.plan?.plan || 'FREE';
        await applyFeatureLocks();
      }
    });
  } catch (error) {
    console.error('Erreur initialisation verrous:', error);
  }
}

// Appliquer les verrous sur les éléments
async function applyFeatureLocks() {
  // Mapping des éléments à leurs features requises
  const elementFeatureMap = {
    'blockSponsored': 'remove_ads',
    'tabCleanerToggle': 'advanced_search',
    'summarizeBtn': 'ai_summarizer',
    'notesViewBtn': 'note_sync',
    'anonymizeBtn': 'ai_summarizer',
    'aiDetectorEnabled': 'ai_summarizer',
    'translatorEnabled': 'ai_translator'
  };
  
  // Vérifier chaque élément
  for (const [elementId, feature] of Object.entries(elementFeatureMap)) {
    const element = document.getElementById(elementId);
    if (!element) continue;
    
    const isAllowed = await isFeatureAllowed(feature);
    
    if (!isAllowed) {
      lockElement(element, feature);
    }
  }
}

// Vérifier si une feature est autorisée
async function isFeatureAllowed(feature) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ 
      action: 'auth-check-feature',
      feature: feature 
    }, (response) => {
      resolve(response?.isAuthorized || false);
    });
  });
}

// Verrouiller un élément
function lockElement(element, feature) {
  if (element.classList.contains('btn') || element.tagName === 'BUTTON') {
    // C'est un bouton
    element.classList.add('locked');
    element.disabled = true;
    
    // Ajouter l'événement pour afficher la modal
    element.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showUpgradeModal(feature, currentUserPlan);
    });
    
  } else if (element.tagName === 'INPUT' && element.type === 'checkbox') {
    // C'est un checkbox
    const row = element.closest('.switch-row');
    if (row) {
      row.classList.add('locked');
    }
    element.disabled = true;
    
    element.addEventListener('change', (e) => {
      e.preventDefault();
      showUpgradeModal(feature, currentUserPlan);
      element.checked = false;
    });
  }
}

// Afficher la modal d'upgrade
function showUpgradeModal(feature, currentPlan) {
  // Créer la modal s'il elle n'existe pas
  let modal = document.getElementById('upgrade-feature-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'upgrade-feature-modal';
    modal.className = 'upgrade-modal hidden';
    document.body.appendChild(modal);
  }
  
  // Déterminer le plan cible
  const targetPlan = (feature === 'ai_chat' || feature === 'priority_features') ? 'MAX' : 'PRO';
  const targetPrice = targetPlan === 'MAX' ? '9.99€' : '4.99€';
  
  // Messages
  const featureNames = {
    'remove_ads': '🚫 Bloquer les publicités',
    'note_sync': '📝 Synchroniser les notes',
    'advanced_search': '🔍 Recherche avancée',
    'ai_summarizer': '✂️ Résumé IA',
    'ai_translator': '🌐 Traducteur IA',
    'custom_shortcuts': '⌨️ Raccourcis personnalisés',
    'ai_chat': '💬 Chat IA',
    'priority_features': '⭐ Fonctionnalités prioritaires',
    'priority_support': '📞 Support prioritaire'
  };
  
  const featureName = featureNames[feature] || 'cette fonctionnalité';
  const icon = targetPlan === 'MAX' ? '👑' : '⭐';
  
  // Remplir le contenu
  modal.innerHTML = `
    <div class="upgrade-modal-content">
      <div class="upgrade-modal-icon">${icon}</div>
      <div class="upgrade-modal-title">Upgrade ${targetPlan}</div>
      <div class="upgrade-modal-message">
        ${featureName} est disponible avec le plan ${targetPlan}<br>
        <strong>${targetPrice}/mois</strong>
      </div>
      <div class="upgrade-modal-buttons">
        <button class="upgrade-modal-btn primary" onclick="upgradeNow('${targetPlan}')">
          ✨ Upgrade ${targetPlan}
        </button>
        <button class="upgrade-modal-btn secondary" onclick="closeUpgradeModal()">
          Plus tard
        </button>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  // Fermer au clic en dehors
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeUpgradeModal();
    }
  });
}

// Fermer la modal d'upgrade
function closeUpgradeModal() {
  const modal = document.getElementById('upgrade-feature-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Ouvrir Stripe pour upgrade
function upgradeNow(plan) {
  // Récupérer l'ID utilisateur
  chrome.runtime.sendMessage({ action: 'auth-get-user' }, (response) => {
    if (response?.user?.id) {
      openStripeCheckout(plan.toLowerCase(), response.user.id);
      closeUpgradeModal();
    } else {
      showToast('❌ Veuillez vous connecter d\'abord', 'error');
    }
  });
}
