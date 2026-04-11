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

  // ============================================================================
  // CALL OPENAI API - NO CORS RESTRICTIONS IN BACKGROUND
  // ============================================================================
  if (message.type === 'AITOOLS_SUMMARIZE' || message.type === 'AITOOLS_TRANSLATE') {
    const OPENAI_API_KEY = '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';
    const OPENAI_MODEL = 'gpt-4o-mini';
    
    const { text, length = 35, targetLang = 'fr' } = message;
    const task = message.type === 'AITOOLS_SUMMARIZE' ? 'summarize' : 'translate';

    (async () => {
      try {
        if (OPENAI_API_KEY === 'sk-proj-YOUR_KEY_HERE') {
          console.warn('[Background] ⚠️ OpenAI API key not configured');
          sendResponse({ success: false, error: 'OpenAI API key not configured' });
          return;
        }

        const systemPrompt = task === 'summarize'
          ? `You are a professional summarizer. Summarize the text to about ${length}% of its original length. Keep key information. Return ONLY the summary, no explanations.`
          : `You are a professional translator. Translate the text to ${targetLang}. Return ONLY the translation, no explanations or comments.`;

        // Retry logic for rate limits
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: text.substring(0, 3000) }
                ],
                temperature: 0.7,
                max_tokens: 1000
              })
            });

            // Handle rate limit (429)
            if (response.status === 429) {
              retries--;
              if (retries > 0) {
                const waitTime = Math.pow(2, 3 - retries) * 2500; // 5s, 10s, 20s
                console.warn(`[Background] ⏱️ Rate limit, retrying in ${waitTime/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
              throw new Error('Rate limited - max retries reached');
            }

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const result = data.choices?.[0]?.message?.content;

            if (result) {
              console.log(`[Background] ✅ ${task} via OpenAI successful`);
              sendResponse({ success: true, result });
              return;
            } else {
              throw new Error('No content in response');
            }

          } catch (err) {
            lastError = err;
            retries--;
            if (retries > 0) {
              const waitTime = Math.pow(2, 3 - retries) * 2500;
              console.warn(`[Background] ⏱️ Error: ${err.message}, retrying in ${waitTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }

        console.error('[Background] ❌ OpenAI request failed after retries:', lastError?.message);
        sendResponse({ success: false, error: lastError?.message || 'OpenAI request failed' });

      } catch (error) {
        console.error('[Background] ❌ OpenAI call failed:', error.message);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep listener alive for async response
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
