// AITools Background Service Worker v4.0
console.log('[AITools] Background worker initialized');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

        // Try MyMemory API
        try {
          const url = new URL('https://api.mymemory.translated.net/get');
          url.searchParams.append('q', textToTranslate);
          url.searchParams.append('langpair', sourceLangCode + '|' + targetLang);

          const response = await fetch(url);
          const data = await response.json();

          if (data?.responseData?.translatedText &&
            data.responseData.translatedText.length > 0 &&
            !data.responseData.translatedText.includes('QUERY LENGTH') &&
            !data.responseData.translatedText.includes('INVALID') &&
            data.responseData.translatedText.toLowerCase() !== textToTranslate.toLowerCase()) {
            sendResponse({ success: true, text: data.responseData.translatedText });
            return;
          }
        } catch (e1) {
          console.log('[AITools] MyMemory failed:', e1.message);
        }

        // Fallback: Reverso
        try {
          const reversoUrl = 'https://api.reverso.net/translate/text/json?language_from=' + sourceLangCode +
            '&language_to=' + targetLang + '&input=' + encodeURIComponent(textToTranslate);
          const reversoResponse = await fetch(reversoUrl);
          const reversoData = await reversoResponse.json();

          if (reversoData?.translation?.length > 0 &&
            reversoData.translation[0].toLowerCase() !== textToTranslate.toLowerCase()) {
            sendResponse({ success: true, text: reversoData.translation[0] });
            return;
          }
        } catch (e2) {
          console.log('[AITools] Reverso failed:', e2.message);
        }

        sendResponse({ success: false, error: 'Translation service unavailable' });
      } catch (e) {
        console.error('[AITools] Translation error:', e.message);
        sendResponse({ success: false, error: e.message });
      }
    })();

    return true;
  }
});

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
      // Button visibility — ALL enabled by default
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
      // Google buttons — ALL enabled by default
      googleButtonsVisibility: {
        lucky: true,
        filters: true,
        maps: true,
        chatgpt: true
      },
      googleButtonsConfig: {
        lucky: { label: '🍀 Chance', action: 'lucky', color: '#5f6368' },
        filters: { label: '🔍 Filtres', action: 'filters', color: '#5f6368' },
        maps: { label: '🗺️ Maps', action: 'maps', color: '#5f6368' },
        chatgpt: { label: '🤖 ChatGPT', action: 'chatgpt', color: '#5f6368' }
      }
    });
  }
});
