// AITools Background Service Worker v4.0
console.log('[AITools] Background worker initialized');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ============================================================================
  // ADD NOTE
  // ============================================================================
  if (message.action === 'addNote') {
    const note = message.data;
    chrome.storage.local.get('notes', (data) => {
      const notes = data.notes || [];
      notes.push(note);
      chrome.storage.local.set({ notes });
      sendResponse({ status: 'Note ajoutée' });
    });
    return true;
  }

  // ============================================================================
  // TRANSLATE TEXT
  // ============================================================================
  if (message.action === 'translateText') {
    const { text, sourceLang, targetLang } = message;
    console.log('[AITools] Translation request:', (sourceLang || 'auto'), '->', targetLang);

    (async () => {
      try {
        if (!text || text.trim().length === 0) {
          sendResponse({ success: false, error: 'Empty text' });
          return;
        }

        const textToTranslate = text.length > 500 ? text.substring(0, 500) : text;
        const validLangs = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar', 'ko', 'tr'];
        const sourceLangCode = validLangs.includes(sourceLang) ? sourceLang : 'en';

        // ---- API 1 : MyMemory ----
        try {
          const url = new URL('https://api.mymemory.translated.net/get');
          url.searchParams.append('q', textToTranslate);
          url.searchParams.append('langpair', sourceLangCode + '|' + targetLang);

          const response = await fetch(url);
          const data = await response.json();

          const translated = data.responseData?.translatedText || '';
          const isSame = translated.trim().toLowerCase() === textToTranslate.trim().toLowerCase();
          const isError =
            data.responseStatus !== 200 ||
            translated.includes('QUERY LENGTH') ||
            translated.includes('INVALID') ||
            translated.includes('NO QUERY') ||
            translated.length < 3 ||
            isSame;

          if (!isError) {
            console.log('[AITools] Translation OK via MyMemory');
            sendResponse({ success: true, text: translated });
            return;
          }
          console.log('[AITools] MyMemory response invalid:', translated.substring(0, 80));
        } catch (e1) {
          console.log('[AITools] MyMemory failed:', e1.message);
        }

        // ---- API 2 : Reverso ----
        try {
          const reversoUrl = 'https://api.reverso.net/translate/text/json?language_from=' +
            sourceLangCode + '&language_to=' + targetLang +
            '&input=' + encodeURIComponent(textToTranslate);

          const reversoResponse = await fetch(reversoUrl);
          const reversoData = await reversoResponse.json();

          const revTranslated = reversoData?.translation?.[0] || '';
          const revSame = revTranslated.trim().toLowerCase() === textToTranslate.trim().toLowerCase();

          if (revTranslated && revTranslated.length > 2 && !revSame) {
            console.log('[AITools] Translation OK via Reverso');
            sendResponse({ success: true, text: revTranslated });
            return;
          }
          console.log('[AITools] Reverso response invalid');
        } catch (e2) {
          console.log('[AITools] Reverso failed:', e2.message);
        }

        // ---- API 3 : LibreTranslate (instance publique) ----
        try {
          const ltResponse = await fetch('https://libretranslate.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: textToTranslate,
              source: sourceLangCode,
              target: targetLang,
              format: 'text'
            })
          });
          const ltData = await ltResponse.json();
          const ltTranslated = ltData?.translatedText || '';
          const ltSame = ltTranslated.trim().toLowerCase() === textToTranslate.trim().toLowerCase();

          if (ltTranslated && ltTranslated.length > 2 && !ltSame) {
            console.log('[AITools] Translation OK via LibreTranslate');
            sendResponse({ success: true, text: ltTranslated });
            return;
          }
        } catch (e3) {
          console.log('[AITools] LibreTranslate failed:', e3.message);
        }

        console.log('[AITools] All translation APIs failed');
        sendResponse({ success: false, error: 'Translation service unavailable' });

      } catch (e) {
        console.error('[AITools] Translation error:', e.message);
        sendResponse({ success: false, error: e.message });
      }
    })();

    return true;
  }
});

// ============================================================================
// ON INSTALL — set all defaults
// ============================================================================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AITools] Extension installed v4.0');
    chrome.storage.local.set({
      extensionEnabled: true,
      darkModeEnabled: false,
      readingTimeEnabled: true,
      blockSponsoredEnabled: false,
      cookieBlockerEnabled: true,
      aiDetectorEnabled: true,
      summarizerEnabled: true,
      autoTranslatorEnabled: true,
      translatorTargetLang: 'fr',
      performanceModeEnabled: false,
      buttonVisibility: {
        googleButtons: true,
        summarizerButton: true,
        focusModeBadge: true,
        aiDetectorBadge: true,
        translationButtons: true,
        quickStatsWidget: true,
        readingTimeBadge: true,
        notesHighlighter: true
      },
      googleButtonsVisibility: { lucky: true, filters: true, maps: true, chatgpt: true },
      googleButtonsConfig: {
        lucky: { label: '🍀 Chance', action: 'lucky', color: '#5f6368' },
        filters: { label: '🔍 Filtres', action: 'filters', color: '#5f6368' },
        maps: { label: '🗺️ Maps', action: 'maps', color: '#5f6368' },
        chatgpt: { label: '🤖 ChatGPT', action: 'chatgpt', color: '#5f6368' }
      }
    });
  }
});
