// AITools Pro v4.0 - Popup Script
// Optimized popup logic with all features integrated

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let state = {
  darkMode: false,
  extensionEnabled: true,
  pomodoroRunning: false,
  tabCleanerEnabled: false,
  readingTimeEnabled: true,
  currencyConverterEnabled: false,
  blockSponsoredEnabled: false,
  notes: [],
  aiDetectorEnabled: true,
  summarizerEnabled: true,
  autoTranslatorEnabled: true,
  translatorTargetLang: 'fr',
  translatorEnabled: true,
  cookieBlockerEnabled: true,
  readingTimeEnabled: true,
  quickStatsEnabled: true,
  youtubeEnabled: true,
  paletteEnabled: true,
  performanceModeEnabled: false,
  buttonVisibility: {
    googleButtons: true,
    summarizerButton: true,
    aiDetectorBadge: true,
    translationButtons: true,
    quickStatsWidget: true,
    readingTimeBadge: true
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load state from storage first
  chrome.storage.local.get(null, (data) => {
    state = { ...state, ...data };
    updateUI();
  });
  
  // Tab Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
  
  // Header Buttons
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('toggleExtension').addEventListener('click', toggleExtension);
  document.getElementById('disableAllBtn').addEventListener('click', disableAll);
  
  // Quick Buttons
  document.getElementById('whatsappBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://whatsapp.com/channel/0029VbCJCg06GcG7aLZPGu1f' });
  });
  
  document.getElementById('chatgptBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://chatgpt.com' });
  });
  
  // Category Buttons - Google Search
  document.querySelectorAll('.category-badge').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      const query = document.getElementById('googleSearchInput').value.trim();
      
      if (!query) {
        alert('⚠️ Entrez une recherche d\'abord');
        return;
      }
      
      const categoryMap = {
        'orthographe': 'https://www.google.com/search?q=correcteur+' + encodeURIComponent(query),
        'wiki': 'https://fr.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query),
        'trends': 'https://trends.google.com/trends/explore?q=' + encodeURIComponent(query),
        'news': 'https://news.google.com/search?q=' + encodeURIComponent(query),
        'images': 'https://images.google.com/search?q=' + encodeURIComponent(query),
        'videos': 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&tbm=vid'
      };
      
      const url = categoryMap[category];
      chrome.tabs.create({ url });
      btn.classList.add('active');
    });
  });
  
  // Filter Menu
  document.getElementById('filterMenuBtn').addEventListener('click', () => {
    document.getElementById('filterModal').classList.remove('hidden');
  });
  
  document.getElementById('closeFilterBtn').addEventListener('click', () => {
    document.getElementById('filterModal').classList.add('hidden');
  });
  
  document.querySelectorAll('.filter-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const operator = btn.dataset.operator;
      const input = document.getElementById('googleSearchInput');
      
      if (!input.value.trim()) {
        alert('⚠️ Entrez une recherche d\'abord');
        return;
      }
      
      let value = '';
      if (operator === '"') {
        value = prompt('Entrez le terme exact à chercher:');
      } else if (operator === 'after:') {
        value = prompt('Date (YYYY-MM-DD):');
      } else if (operator === 'before:') {
        value = prompt('Date (YYYY-MM-DD):');
      } else {
        value = prompt(`Entrez la valeur pour ${operator}:`);
      }
      
      if (value) {
        input.value += ' ' + operator + value;
      }
      
      document.getElementById('filterModal').classList.add('hidden');
    });
  });
  
  // Dark Mode Toggle
  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
  
  // Block Sponsored Toggle
  document.getElementById('blockSponsored').addEventListener('change', (e) => {
    state.blockSponsoredEnabled = e.target.checked;
    chrome.storage.local.set({ blockSponsoredEnabled: e.target.checked });
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'blockSponsored',
          enabled: e.target.checked
        }).catch(() => {
          console.log('[AITools] Cannot message this tab');
        });
      }
    });
  });
  
  // Pomodoro Toggle
  document.getElementById('pomodoroToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
      startPomodoro();
    } else {
      state.pomodoroRunning = false;
      document.getElementById('pomodoroStatus').style.display = 'none';
    }
  });
  
  // Tab Cleaner Toggle
  document.getElementById('tabCleanerToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
      cleanupTabs();
    }
  });
  
  // Performance Mode Toggle
  const perfModeToggle = document.getElementById('performanceModeEnabled');
  if (perfModeToggle) {
    perfModeToggle.addEventListener('change', (e) => {
      state.performanceModeEnabled = e.target.checked;
      chrome.storage.local.set({ performanceModeEnabled: e.target.checked });
      
      console.log('[AITools] Performance mode:', e.target.checked ? 'ENABLED' : 'DISABLED');
      
      // Notify content scripts about performance mode
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'togglePerformanceMode',
            enabled: e.target.checked
          }).catch(() => {});
        });
      });
    });
  }
  
  // Notes Button
  document.getElementById('notesViewBtn').addEventListener('click', showNotesModal);
  document.getElementById('closeNotesBtn').addEventListener('click', () => {
    document.getElementById('notesModal').classList.add('hidden');
  });
  
  document.getElementById('clearNotesBtn').addEventListener('click', () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir effacer toutes les notes?')) {
      state.notes = [];
      chrome.storage.local.set({ notes: [] });
      showNotesModal();
    }
  });

  // Summarize Text Button
  document.getElementById('summarizeBtn').addEventListener('click', () => {
    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to content script to extract text
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractText' }, (response) => {
          if (response && response.text) {
            const summary = summarizeText(response.text);
            const modal = document.getElementById('notesModal');
            const list = document.getElementById('notesList');
            
            list.innerHTML = `
              <div style="padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 12px; line-height: 1.6;">
                <strong>📋 Résumé de la page:</strong>
                <p style="margin-top: 8px; color: #333;">${summary}</p>
              </div>
            `;
            
            modal.classList.remove('hidden');
          } else {
            alert('⚠️ Impossible d\'extraire le texte de cette page');
          }
        }).catch(() => {
          alert('⚠️ Impossible d\'accéder au contenu de la page');
        });
      }
    });
  });
  
  // Reading Time Toggle
  document.getElementById('readingTimeToggle').addEventListener('change', (e) => {
    state.readingTimeEnabled = e.target.checked;
    chrome.storage.local.set({ readingTimeEnabled: e.target.checked });
  });
  
  // Currency Converter Toggle
  document.getElementById('currencyConverterToggle').addEventListener('change', (e) => {
    state.currencyConverterEnabled = e.target.checked;
    chrome.storage.local.set({ currencyConverterEnabled: e.target.checked });
  });
  
  // Export Data
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  
  // Reset Button
  document.getElementById('resetBtn').addEventListener('click', resetExtension);

  // ============================================================================
  // BUTTON MANAGEMENT - NEW SECTION
  // ============================================================================
  
  // Button Toggles
  document.querySelectorAll('.button-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const buttonType = e.target.dataset.buttonType;
      const isVisible = e.target.checked;
      
      // Update state
      if (!state.buttonVisibility) state.buttonVisibility = {};
      state.buttonVisibility[buttonType] = isVisible;
      
      // Save to storage
      chrome.storage.local.set({ buttonVisibility: state.buttonVisibility });
      
      console.log('[AITools Popup] Button toggle:', buttonType, '=', isVisible);
      
      // Notify all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateButtonVisibility',
            buttonType: buttonType,
            isVisible: isVisible
          }).catch(() => {
            // Silent fail for tabs that don't have content script
          });
        });
      });
    });
  });
  
  // Reset All Button Positions
  document.getElementById('resetAllButtonPositionsBtn')?.addEventListener('click', () => {
    if (!confirm('Êtes-vous sûr? Cela réinitialisera les positions ET visibilité de tous les boutons.')) return;
    
    // Get all storage data to find all position keys
    chrome.storage.local.get(null, (data) => {
      // Find all keys that contain position data
      const keysToRemove = Object.keys(data).filter(k => 
        k.includes('-pos') && k.includes('aitools')
      );
      
      console.log('[AITools Popup] Removing position keys:', keysToRemove);
      
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove);
      }
      
      // Also restore default button visibility
      const defaultButtonVisibility = {
        googleButtons: true,
        summarizerButton: true,
        aiDetectorBadge: true,
        translationButtons: true,
        quickStatsWidget: true,
        readingTimeBadge: true
      };
      
      chrome.storage.local.set({ buttonVisibility: defaultButtonVisibility });
    });
    
    // Notify all tabs to refresh positions and visibility
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'resetButtonPositions'
        }).catch(() => {
          // Silent fail
        });
      });
    });
    
    alert('✅ Positions et visibilité réinitialisées! Rechargez les pages pour voir les changements.');
  });

  // Layout Management
  const layoutSelect = document.getElementById('layoutSelect');
  const layoutSelect2 = document.getElementById('layoutSelect2');
  
  function setupLayoutControl(selectElement) {
    if (!selectElement) return;
    
    // Load saved layout
    chrome.storage.local.get('aitools-layout', (data) => {
      if (data['aitools-layout']) {
        selectElement.value = data['aitools-layout'];
      }
    });

    // Handle layout change
    selectElement.addEventListener('change', (e) => {
      const layout = e.target.value;
      chrome.storage.local.set({ 'aitools-layout': layout });
      
      // Sync both select elements
      if (layoutSelect && layoutSelect !== selectElement) layoutSelect.value = layout;
      if (layoutSelect2 && layoutSelect2 !== selectElement) layoutSelect2.value = layout;
      
      // Notify all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'setLayout',
            layout: layout
          }).catch(() => {
            // Silent fail
          });
        });
      });
    });
  }
  
  setupLayoutControl(layoutSelect);
  setupLayoutControl(layoutSelect2);

  // Reset Layout Button
  function setupResetLayout(buttonElement) {
    if (!buttonElement) return;
    
    buttonElement.addEventListener('click', () => {
      chrome.storage.local.set({
        'aitools-layout': 'adaptive',
        'aitools-layout-custom': {}
      });
      
      if (layoutSelect) layoutSelect.value = 'adaptive';
      if (layoutSelect2) layoutSelect2.value = 'adaptive';
      
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'resetLayout'
          }).catch(() => {
            // Silent fail
          });
        });
      });
      
      alert('✅ Layout réinitialisé par défaut!');
    });
  }
  
  setupResetLayout(document.getElementById('resetLayoutBtn'));
  setupResetLayout(document.getElementById('resetPositionsBtn2'));

  // AI Tools
  document.getElementById('aiDetectorBtn').addEventListener('click', detectAI);
  document.getElementById('translatorBtn').addEventListener('click', openTranslator);
  document.getElementById('paletteBtn').addEventListener('click', generatePalette);
  document.getElementById('youtubeBtn').addEventListener('click', openYouTubeEnhancer);
  document.getElementById('pdfBtn').addEventListener('click', openPDFTools);

  // Settings Toggles for AI Tools
  document.getElementById('aiDetectorEnabled').addEventListener('change', (e) => {
    state.aiDetectorEnabled = e.target.checked;
    chrome.storage.local.set({ aiDetectorEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: state });
  });

  document.getElementById('summarizerEnabled').addEventListener('change', (e) => {
    state.summarizerEnabled = e.target.checked;
    chrome.storage.local.set({ summarizerEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: state });
  });

  document.getElementById('autoTranslatorEnabled').addEventListener('change', (e) => {
    state.autoTranslatorEnabled = e.target.checked;
    chrome.storage.local.set({ autoTranslatorEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: state });
  });

  const targetLangSelect = document.getElementById('translatorTargetLang');
  if (targetLangSelect) {
    chrome.storage.local.get('translatorTargetLang', (data) => {
      if (data.translatorTargetLang) targetLangSelect.value = data.translatorTargetLang;
    });
    targetLangSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      chrome.storage.local.set({ translatorTargetLang: value });
      notifyContentScript({ action: 'updateSettings', settings: { translatorTargetLang: value } });
    });
  }

  document.getElementById('translatorEnabled').addEventListener('change', (e) => {
    state.translatorEnabled = e.target.checked;
    chrome.storage.local.set({ translatorEnabled: e.target.checked });
  });

  document.getElementById('cookieBlockerEnabled').addEventListener('change', (e) => {
    state.cookieBlockerEnabled = e.target.checked;
    chrome.storage.local.set({ cookieBlockerEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { cookieBlockerEnabled: e.target.checked } });
  });

  document.getElementById('readingTimeEnabled').addEventListener('change', (e) => {
    state.readingTimeEnabled = e.target.checked;
    chrome.storage.local.set({ readingTimeEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { readingTimeEnabled: e.target.checked } });
  });

  document.getElementById('quickStatsEnabled').addEventListener('change', (e) => {
    state.quickStatsEnabled = e.target.checked;
    chrome.storage.local.set({ quickStatsEnabled: e.target.checked });
    notifyContentScript({ action: 'updateSettings', settings: { quickStatsEnabled: e.target.checked } });
  });

  document.getElementById('youtubeEnabled').addEventListener('change', (e) => {
    state.youtubeEnabled = e.target.checked;
    chrome.storage.local.set({ youtubeEnabled: e.target.checked });
  });

  document.getElementById('paletteEnabled').addEventListener('change', (e) => {
    state.paletteEnabled = e.target.checked;
    chrome.storage.local.set({ paletteEnabled: e.target.checked });
  });

  // Google Search Buttons Visibility Controls
  chrome.storage.local.get('googleButtonsVisibility', (result) => {
    const visibility = result.googleButtonsVisibility || {
      lucky: true,
      filters: true,
      maps: true,
      chatgpt: true
    };
    
    // Set initial checkbox states
    if (document.getElementById('googleButtonLucky')) {
      document.getElementById('googleButtonLucky').checked = visibility.lucky !== false;
    }
    if (document.getElementById('googleButtonFilters')) {
      document.getElementById('googleButtonFilters').checked = visibility.filters !== false;
    }
    if (document.getElementById('googleButtonMaps')) {
      document.getElementById('googleButtonMaps').checked = visibility.maps !== false;
    }
    if (document.getElementById('googleButtonChatGPT')) {
      document.getElementById('googleButtonChatGPT').checked = visibility.chatgpt !== false;
    }
  });

  // Google Button: Chance (Lucky)
  const googleButtonLucky = document.getElementById('googleButtonLucky');
  if (googleButtonLucky) {
    googleButtonLucky.addEventListener('change', (e) => {
      chrome.storage.local.get('googleButtonsVisibility', (result) => {
        const visibility = result.googleButtonsVisibility || {
          lucky: true,
          filters: true,
          maps: true,
          chatgpt: true
        };
        visibility.lucky = e.target.checked;
        chrome.storage.local.set({ googleButtonsVisibility: visibility });
        notifyContentScript({ action: 'updateGoogleButtons', visibility: visibility });
      });
    });
  }

  // Google Button: Filters
  const googleButtonFilters = document.getElementById('googleButtonFilters');
  if (googleButtonFilters) {
    googleButtonFilters.addEventListener('change', (e) => {
      chrome.storage.local.get('googleButtonsVisibility', (result) => {
        const visibility = result.googleButtonsVisibility || {
          lucky: true,
          filters: true,
          maps: true,
          chatgpt: true
        };
        visibility.filters = e.target.checked;
        chrome.storage.local.set({ googleButtonsVisibility: visibility });
        notifyContentScript({ action: 'updateGoogleButtons', visibility: visibility });
      });
    });
  }

  // Google Button: Maps
  const googleButtonMaps = document.getElementById('googleButtonMaps');
  if (googleButtonMaps) {
    googleButtonMaps.addEventListener('change', (e) => {
      chrome.storage.local.get('googleButtonsVisibility', (result) => {
        const visibility = result.googleButtonsVisibility || {
          lucky: true,
          filters: true,
          maps: true,
          chatgpt: true
        };
        visibility.maps = e.target.checked;
        chrome.storage.local.set({ googleButtonsVisibility: visibility });
        notifyContentScript({ action: 'updateGoogleButtons', visibility: visibility });
      });
    });
  }

  // Google Button: ChatGPT
  const googleButtonChatGPT = document.getElementById('googleButtonChatGPT');
  if (googleButtonChatGPT) {
    googleButtonChatGPT.addEventListener('change', (e) => {
      chrome.storage.local.get('googleButtonsVisibility', (result) => {
        const visibility = result.googleButtonsVisibility || {
          lucky: true,
          filters: true,
          maps: true,
          chatgpt: true
        };
        visibility.chatgpt = e.target.checked;
        chrome.storage.local.set({ googleButtonsVisibility: visibility });
        notifyContentScript({ action: 'updateGoogleButtons', visibility: visibility });
      });
    });
  }

  // Google Buttons Customization
  const defaults = {
    lucky: { label: '🍀 Chance', action: 'lucky', color: '#5f6368' },
    filters: { label: '🔍 Filtres', action: 'filters', color: '#5f6368' },
    maps: { label: '🗺️ Maps', action: 'maps', color: '#5f6368' },
    chatgpt: { label: '🤖 ChatGPT', action: 'chatgpt', color: '#5f6368' }
  };

  const customizeSelect = document.getElementById('googleButtonCustomizeSelect');
  const customizeView = document.getElementById('googleButtonCustomizeView');
  const customizeLabel = document.getElementById('googleButtonCustomizeLabel');
  const customizeColor = document.getElementById('googleButtonCustomizeColor');
  const customizeAction = document.getElementById('googleButtonCustomizeAction');
  const customizeReset = document.getElementById('googleButtonCustomizeReset');

  if (customizeSelect) {
    // Load current config when selecting a button
    customizeSelect.addEventListener('change', (e) => {
      const buttonKey = e.target.value;
      
      if (!buttonKey) {
        customizeView.style.display = 'none';
        return;
      }
      
      // Load current custom config or defaults
      chrome.storage.local.get('googleButtonsConfig', (result) => {
        const config = result.googleButtonsConfig || {};
        const buttonConfig = config[buttonKey] || defaults[buttonKey];
        
        customizeLabel.value = buttonConfig.label || defaults[buttonKey].label;
        customizeColor.value = buttonConfig.color || defaults[buttonKey].color;
        customizeAction.value = buttonConfig.action || defaults[buttonKey].action;
        
        customizeView.style.display = 'block';
      });
    });

    // Save label changes
    if (customizeLabel) {
      customizeLabel.addEventListener('blur', (e) => {
        const buttonKey = customizeSelect.value;
        if (buttonKey) {
          chrome.storage.local.get('googleButtonsConfig', (result) => {
            const config = result.googleButtonsConfig || {};
            if (!config[buttonKey]) config[buttonKey] = defaults[buttonKey];
            config[buttonKey].label = e.target.value || defaults[buttonKey].label;
            chrome.storage.local.set({ googleButtonsConfig: config });
            notifyContentScript({ action: 'updateGoogleButtons', config: config });
          });
        }
      });
    }

    // Save color changes
    if (customizeColor) {
      customizeColor.addEventListener('change', (e) => {
        const buttonKey = customizeSelect.value;
        if (buttonKey) {
          chrome.storage.local.get('googleButtonsConfig', (result) => {
            const config = result.googleButtonsConfig || {};
            if (!config[buttonKey]) config[buttonKey] = defaults[buttonKey];
            config[buttonKey].color = e.target.value;
            chrome.storage.local.set({ googleButtonsConfig: config });
            notifyContentScript({ action: 'updateGoogleButtons', config: config });
          });
        }
      });
    }

    // Save action changes
    if (customizeAction) {
      customizeAction.addEventListener('change', (e) => {
        const buttonKey = customizeSelect.value;
        if (buttonKey) {
          chrome.storage.local.get('googleButtonsConfig', (result) => {
            const config = result.googleButtonsConfig || {};
            if (!config[buttonKey]) config[buttonKey] = defaults[buttonKey];
            config[buttonKey].action = e.target.value;
            chrome.storage.local.set({ googleButtonsConfig: config });
            notifyContentScript({ action: 'updateGoogleButtons', config: config });
          });
        }
      });
    }

    // Reset to defaults
    if (customizeReset) {
      customizeReset.addEventListener('click', () => {
        const buttonKey = customizeSelect.value;
        if (buttonKey) {
          chrome.storage.local.get('googleButtonsConfig', (result) => {
            const config = result.googleButtonsConfig || {};
            config[buttonKey] = defaults[buttonKey];
            chrome.storage.local.set({ googleButtonsConfig: config });
            
            // Update UI
            customizeLabel.value = defaults[buttonKey].label;
            customizeColor.value = defaults[buttonKey].color;
            customizeAction.value = defaults[buttonKey].action;
            
            notifyContentScript({ action: 'updateGoogleButtons', config: config });
          });
        }
      });
    }
  }

  // Slider controls for AI Detector sensitivity
  const aiSensSlider = document.getElementById('aiDetectorSensitivity');
  if (aiSensSlider) {
    chrome.storage.local.get('aiDetectorSensitivity', (data) => {
      if (data.aiDetectorSensitivity) aiSensSlider.value = data.aiDetectorSensitivity;
      document.getElementById('aiSensValue').textContent = aiSensSlider.value;
    });
    aiSensSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      document.getElementById('aiSensValue').textContent = value;
      chrome.storage.local.set({ aiDetectorSensitivity: value });
      notifyContentScript({ action: 'updateSettings', settings: { aiDetectorSensitivity: value } });
    });
  }

  // Slider control for Summarizer length
  const sumLenSlider = document.getElementById('summarizerLength');
  if (sumLenSlider) {
    chrome.storage.local.get('summarizerLength', (data) => {
      if (data.summarizerLength) sumLenSlider.value = data.summarizerLength;
      document.getElementById('sumLenValue').textContent = sumLenSlider.value;
    });
    sumLenSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      document.getElementById('sumLenValue').textContent = value;
      chrome.storage.local.set({ summarizerLength: value });
      notifyContentScript({ action: 'updateSettings', settings: { summarizerLength: value } });
    });
  }

  // Summarizer Language selector
  const summarizerLangSelect = document.getElementById('summarizerLang');
  if (summarizerLangSelect) {
    chrome.storage.local.get('summarizerLang', (data) => {
      if (data.summarizerLang) summarizerLangSelect.value = data.summarizerLang;
    });
    summarizerLangSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      chrome.storage.local.set({ summarizerLang: value });
      notifyContentScript({ action: 'updateSettings', settings: { summarizerLang: value } });
    });
  }

  // Newtab URL selector
  const newtabPreset = document.getElementById('newtabUrlPreset');
  const newtabCustom = document.getElementById('newtabUrlCustom');
  if (newtabPreset && newtabCustom) {
    chrome.storage.local.get(['newtabUrlPreset', 'newtabUrlCustom'], (data) => {
      const preset = data.newtabUrlPreset || 'google';
      newtabPreset.value = preset;
      if (preset === 'custom') {
        newtabCustom.style.display = 'block';
        if (data.newtabUrlCustom) newtabCustom.value = data.newtabUrlCustom;
      }
    });
    newtabPreset.addEventListener('change', (e) => {
      const preset = e.target.value;
      chrome.storage.local.set({ newtabUrlPreset: preset });
      if (preset === 'custom') {
        newtabCustom.style.display = 'block';
      } else {
        newtabCustom.style.display = 'none';
      }
    });
    newtabCustom.addEventListener('input', (e) => {
      const url = e.target.value;
      chrome.storage.local.set({ newtabUrlCustom: url });
    });
  }

  // Reset positions button
  document.getElementById('resetPositionsBtn').addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser les positions de tous les boutons ?')) {
      chrome.storage.local.remove(['aitools-ai-badge-pos', 'aitools-summarize-btn-pos']);
      notifyContentScript({ action: 'resetPositions' });
      alert('✅ Positions réinitialisées !');
    }
  });
});

// ============================================================================
// FUNCTIONS
// ============================================================================

function detectAI() {
  const text = prompt('🤖 Collez le texte à analyser:');
  if (!text || text.trim().length < 50) {
    alert('⚠️ Le texte doit faire au moins 50 caractères');
    return;
  }

  // Simple AI detection heuristic
  const indicators = {
    passivUndefinedoice: (text.match(/(\bwas\b|\bwere\b|\bbeing\b|\bby\b)/gi) || []).length,
    repetitiveStructure: (text.match(/(\.\s[A-Z][a-z]{3,})/g) || []).length,
    formalTone: (text.match(/(\bthus\b|\btherefore\b|\bmoreover\b|\bfurthermore\b)/gi) || []).length,
    unusualPunctuation: (text.match(/[""'']/g) || []).length,
  };

  const score = (indicators.repetitiveStructure * 0.4 + indicators.formalTone * 0.3) / text.split(' ').length * 100;
  
  let result = `📊 Analyse IA:\n\n`;
  result += `Score de probabilité IA: ${Math.min(100, Math.round(score))}%\n\n`;
  
  if (score > 50) {
    result += `❌ Forte probabilité de contenu généré par IA\n(Langage formel, structure répétitive)`;
  } else if (score > 25) {
    result += `🟡 Probabilité modérée\n(Certaines caractéristiques IA détectées)`;
  } else {
    result += `✅ Semble être du contenu humain\n(Langage naturel détecté)`;
  }
  
  alert(result);
}

function openTranslator() {
  const text = prompt('🌐 Texte à traduire:');
  if (!text || !text.trim()) return;
  
  // Open Google Translate with the text
  chrome.tabs.create({
    url: `https://translate.google.com/?text=${encodeURIComponent(text.substring(0, 500))}&op=translate`
  });
}

function generatePalette() {
  const colors = [];
  for (let i = 0; i < 5; i++) {
    const hue = Math.random() * 360;
    const saturation = 60 + Math.random() * 30;
    const lightness = 50 + Math.random() * 30;
    const hex = hslToHex(hue, saturation, lightness);
    colors.push(hex);
  }
  
  const modal = document.getElementById('notesModal');
  const list = document.getElementById('notesList');
  
  let html = '<div style="font-size: 11px;"><strong>🎨 Palette générée:</strong><br><br>';
  colors.forEach(color => {
    html += `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 6px; background: #f5f5f5; border-radius: 4px;">
        <div style="width: 40px; height: 40px; background: ${color}; border-radius: 4px; border: 1px solid #ddd;"></div>
        <code style="font-size: 10px; cursor: pointer;" onclick="navigator.clipboard.writeText('${color}')">${color}</code>
      </div>
    `;
  });
  html += '</div>';
  
  list.innerHTML = html;
  modal.classList.remove('hidden');
}

function openYouTubeEnhancer() {
  const modal = document.getElementById('notesModal');
  const list = document.getElementById('notesList');
  
  list.innerHTML = `
    <div style="font-size: 11px; line-height: 1.6;">
      <strong>▶️ YouTube Enhancer</strong><br><br>
      <p><strong>✨ Features disponibles:</strong></p>
      <ul style="margin: 8px 0; padding-left: 16px;">
        <li>⏩ Lecture contrôlée (0.5x - 2x)</li>
        <li>🎯 Mode Picture-in-Picture</li>
        <li>📊 Statistiques vidéo avancées</li>
        <li>🎨 Thème personnalisé</li>
      </ul>
      <p style="color: #666; font-size: 10px; margin-top: 12px;">Rendez-vous sur YouTube pour accéder aux features!</p>
      <button onclick="chrome.tabs.create({url: 'https://www.youtube.com'})" style="
        background: #ff0000;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-top: 8px;
      ">Aller sur YouTube</button>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

function openPDFTools() {
  const modal = document.getElementById('notesModal');
  const list = document.getElementById('notesList');
  
  list.innerHTML = `
    <div style="font-size: 11px; line-height: 1.6;">
      <strong>📄 PDF Tools</strong><br><br>
      <p><strong>🔧 Capacités:</strong></p>
      <ul style="margin: 8px 0; padding-left: 16px;">
        <li>✂️ Extraire texte des PDF</li>
        <li>🔍 Chercher dans les PDFs</li>
        <li>📋 Copier du contenu</li>
      </ul>
      <p style="color: #666; font-size: 10px; margin-top: 12px;">Ouvrez un PDF dans votre navigateur pour utiliser ces features!</p>
      <input type="file" id="pdfInput" accept=".pdf" style="font-size: 11px; margin-top: 8px;">
      <button id="extractPdfBtn" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-top: 8px;
      ">Extraire texte</button>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  document.getElementById('extractPdfBtn').addEventListener('click', () => {
    const file = document.getElementById('pdfInput').files[0];
    if (file) {
      alert('📄 Extraction PDF en cours...\n\nNote: Une version complète nécessiterait une API PDF.');
    }
  });
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map(x => {
    const hex = Math.round(255 * x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function summarizeText(text) {
  if (!text || text.length < 100) return text;
  
  // Smart sentence extraction
  let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  sentences = sentences.map(s => s.trim()).filter(s => s.length > 20);
  
  if (sentences.length <= 2) return text;
  
  // Enhanced keyword scoring
  const keywords = {
    'important': 4, 'clé': 4, 'principal': 3, 'essentiel': 4,
    'crucial': 4, 'résultat': 4, 'conclusion': 4, 'découvert': 4,
    'innovation': 3, 'unique': 3, 'étude': 3, 'analyse': 2,
    'impact': 4, 'succès': 3, 'donc': 2, 'cependant': 2,
    'par conséquent': 2, 'finalement': 2
  };

  const scoredSentences = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().split(/\s+/);
    let score = 1;
    
    // Position scoring
    if (index === 0) score += 5;
    if (index === sentences.length - 1) score += 4;
    if (index === sentences.length - 2) score += 2;
    
    // Length optimization (8-30 words ideal)
    const wordCount = words.length;
    if (wordCount >= 8 && wordCount <= 30) score += 3;
    else if (wordCount >= 5 && wordCount < 8) score += 1;
    else if (wordCount < 5) score -= 2;
    
    // Keyword matching
    for (const [keyword, weight] of Object.entries(keywords)) {
      if (sentence.toLowerCase().includes(keyword)) score += weight;
    }
    
    // Named entities (numbers, capitals)
    if (/\d+/.test(sentence)) score += 1;
    const capitals = (sentence.match(/[A-Z]/g) || []).length;
    if (capitals > 3) score += 1;
    
    return { sentence: sentence.trim(), score, index };
  });
  
  // Select and restore order
  const keepCount = Math.max(2, Math.ceil(sentences.length * 0.35));
  const summary = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence)
    .join(' ');
  
  return summary.length > 500 ? summary.substring(0, 497) + '...' : summary;
}

function updateUI() {
  document.getElementById('darkModeToggle').checked = state.darkMode;
  document.getElementById('blockSponsored').checked = state.blockSponsoredEnabled;
  document.getElementById('pomodoroToggle').checked = state.pomodoroRunning;
  document.getElementById('readingTimeToggle').checked = state.readingTimeEnabled;
  document.getElementById('currencyConverterToggle').checked = state.currencyConverterEnabled;
  
  // AI Tools toggles
  document.getElementById('aiDetectorEnabled').checked = state.aiDetectorEnabled;
  document.getElementById('summarizerEnabled').checked = state.summarizerEnabled;
  document.getElementById('translatorEnabled').checked = state.translatorEnabled;
  document.getElementById('cookieBlockerEnabled').checked = state.cookieBlockerEnabled;
  document.getElementById('youtubeEnabled').checked = state.youtubeEnabled;
  document.getElementById('paletteEnabled').checked = state.paletteEnabled;
  
  // Performance mode toggle
  const perfModeToggle = document.getElementById('performanceModeEnabled');
  if (perfModeToggle) {
    perfModeToggle.checked = state.performanceModeEnabled;
  }
  
  // Button visibility toggles
  if (document.getElementById('googleButtonsVisible')) {
    document.getElementById('googleButtonsVisible').checked = state.buttonVisibility?.googleButtons !== false;
  }
  if (document.getElementById('summarizerButtonVisible')) {
    document.getElementById('summarizerButtonVisible').checked = state.buttonVisibility?.summarizerButton !== false;
  }
  if (document.getElementById('aiDetectorBadgeVisible')) {
    document.getElementById('aiDetectorBadgeVisible').checked = state.buttonVisibility?.aiDetectorBadge !== false;
  }
  if (document.getElementById('translationButtonsVisible')) {
    document.getElementById('translationButtonsVisible').checked = state.buttonVisibility?.translationButtons !== false;
  }
  if (document.getElementById('quickStatsWidgetVisible')) {
    document.getElementById('quickStatsWidgetVisible').checked = state.buttonVisibility?.quickStatsWidget !== false;
  }
  if (document.getElementById('readingTimeBadgeVisible')) {
    document.getElementById('readingTimeBadgeVisible').checked = state.buttonVisibility?.readingTimeBadge !== false;
  }
  
  if (state.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  if (!state.extensionEnabled) {
    document.getElementById('toggleExtension').style.opacity = '0.5';
  }
}

function notifyContentScript(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    });
  });
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  chrome.storage.local.set({ darkMode: state.darkMode });
  
  document.body.classList.toggle('dark-mode');
  document.getElementById('darkModeToggle').checked = state.darkMode;
  
  // Notify content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleDarkMode',
        enabled: state.darkMode
      }).catch(() => {});
    });
  });
}

function toggleExtension() {
  state.extensionEnabled = !state.extensionEnabled;
  chrome.storage.local.set({ extensionEnabled: state.extensionEnabled });
  
  document.getElementById('toggleExtension').style.opacity = state.extensionEnabled ? '1' : '0.5';
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleExtension',
        enabled: state.extensionEnabled
      }).catch(() => {});
    });
  });
}

function disableAll() {
  // Disable all features
  const allSettings = {
    aiDetectorEnabled: false,
    summarizerEnabled: false,
    autoTranslatorEnabled: false,
    translatorEnabled: false,
    readingTimeEnabled: false,
    quickStatsEnabled: false,
    blockSponsoredEnabled: false,
    paletteEnabled: false,
    youtubeEnabled: false,
    cookieBlockerEnabled: false,
    googleButtonsVisibility: { lucky: false, filters: false, maps: false, chatgpt: false }
  };
  
  // Save to storage
  chrome.storage.local.set(allSettings);
  
  // Update UI checkboxes
  const checkboxesToUncheck = [
    'aiDetectorEnabled',
    'summarizerEnabled',
    'autoTranslatorEnabled',
    'translatorEnabled',
    'readingTimeEnabled',
    'quickStatsEnabled',
    'blockSponsored',
    'paletteEnabled',
    'youtubeEnabled',
    'cookieBlockerEnabled',
    'darkModeToggle',
    'pomodoroToggle',
    'tabCleanerToggle',
    'readingTimeToggle',
    'currencyConverterToggle'
  ];
  
  checkboxesToUncheck.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.checked = false;
  });
  
  // Update Google buttons
  const googleButtons = ['googleButtonLucky', 'googleButtonFilters', 'googleButtonMaps', 'googleButtonChatGPT'];
  googleButtons.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.checked = false;
  });
  
  // Notify content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: allSettings
      }).catch(() => {});
    });
  });
  
  console.log('[AITools] All features disabled');
}

function startPomodoro() {
  state.pomodoroRunning = true;
  const startTime = Date.now();
  const duration = 25 * 60 * 1000;
  
  const status = document.getElementById('pomodoroStatus');
  status.style.display = 'block';
  
  let timerRef;
  const updateTimer = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    
    status.innerHTML = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    
    if (remaining > 0) {
      timerRef = setTimeout(updateTimer, 1000);
    } else {
      status.innerHTML = '✅ Pomodoro Terminé!';
      document.getElementById('pomodoroToggle').checked = false;
      state.pomodoroRunning = false;
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'rocket-icon.svg',
          title: '⏱️ Pomodoro',
          message: 'C\'est l\'heure de prendre une pause!'
        });
      } catch(e) {}
    }
  };
  
  updateTimer();
}

function cleanupTabs() {
  chrome.tabs.query({}, (tabs) => {
    const grouped = {};
    
    tabs.forEach(tab => {
      const domain = new URL(tab.url).hostname || 'unknown';
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(tab);
    });
    
    Object.values(grouped).forEach(group => {
      if (group.length > 1) {
        try {
          chrome.tabGroups.group(
            { tabIds: group.slice(1).map(t => t.id) },
            { title: group[0].title?.substring(0, 20) }
          );
        } catch (e) {
          console.log('Tab grouping not available');
        }
      }
    });
  });
}

function showNotesModal() {
  const modal = document.getElementById('notesModal');
  const list = document.getElementById('notesList');
  
  if (state.notes.length === 0) {
    list.innerHTML = '<p style="color: #999; font-size: 12px;">Pas de notes encore. Surligné un texte sur une page!</p>';
  } else {
    list.innerHTML = state.notes
      .map((note, i) => `
        <div style="
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 11px;
          word-break: break-word;
        ">
          <strong>${note.title || 'Note'}</strong>
          <p style="margin-top: 4px; color: #666;">"${note.text}"</p>
          <button onclick="deleteNote(${i})" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 10px;
            cursor: pointer;
            margin-top: 4px;
          ">Supprimer</button>
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

function exportData() {
  const data = {
    notes: state.notes,
    timestamp: new Date().toISOString(),
    version: '4.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aitools-export-${Date.now()}.json`;
  a.click();
}

function resetExtension() {
  if (confirm('⚠️ Réinitialiser toutes les données? Cette action est irréversible.')) {
    chrome.storage.local.clear(() => {
      state = {
        darkMode: false,
        extensionEnabled: true,
        pomodoroRunning: false,
        tabCleanerEnabled: false,
        readingTimeEnabled: true,
        currencyConverterEnabled: false,
        blockSponsoredEnabled: false,
        notes: []
      };
      updateUI();
      alert('✅ Extension réinitialisée');
    });
  }
}

// Load notes on startup
chrome.storage.local.get('notes', (data) => {
  if (data.notes) {
    state.notes = data.notes;
  }
});


// Listen for storage changes from other tabs and content script
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.darkMode) state.darkMode = changes.darkMode.newValue;
    if (changes.notes) {
      state.notes = changes.notes.newValue || [];
      const modal = document.getElementById('notesModal');
      if (modal && !modal.classList.contains('hidden')) {
        showNotesModal();
      }
    }
    if (changes.blockSponsoredEnabled) state.blockSponsoredEnabled = changes.blockSponsoredEnabled.newValue;
    if (changes.readingTimeEnabled) state.readingTimeEnabled = changes.readingTimeEnabled.newValue;
    if (changes.currencyConverterEnabled) state.currencyConverterEnabled = changes.currencyConverterEnabled.newValue;
    if (changes.aiDetectorEnabled) state.aiDetectorEnabled = changes.aiDetectorEnabled.newValue;
    if (changes.summarizerEnabled) state.summarizerEnabled = changes.summarizerEnabled.newValue;
    if (changes.translatorEnabled) state.translatorEnabled = changes.translatorEnabled.newValue;
    if (changes.youtubeEnabled) state.youtubeEnabled = changes.youtubeEnabled.newValue;
    if (changes.paletteEnabled) state.paletteEnabled = changes.paletteEnabled.newValue;
    updateUI();
  }
});