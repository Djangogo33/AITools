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
  }
  
  // Handle translation requests from content script
  if (message.action === 'translateText') {
    const { text, targetLang } = message;
    console.log('[AITools] Translation request: targetLang=' + targetLang + ', textLength=' + (text?.length || 0));
    
    (async () => {
      try {
        if (!text || text.trim().length === 0) {
          console.log('[AITools] Translation failed: empty text');
          sendResponse({ success: false, error: 'Empty text' });
          return;
        }
        
        // Limit text size: MyMemory allows 500, Reverso allows 500
        const textToTranslate = text.length > 500 ? text.substring(0, 500) : text;
        
        // Language mapping for APIs
        const langMap = {
          'fr': 'fr', 'en': 'en', 'es': 'es', 'de': 'de',
          'it': 'it', 'pt': 'pt', 'ru': 'ru', 'ja': 'ja',
          'zh': 'zh', 'ar': 'ar', 'ko': 'ko', 'tr': 'tr'
        };
        const apiLang = langMap[targetLang] || 'en';
        
        console.log('[AITools] Attempting translation to: ' + apiLang);
        
        // Try MyMemory API (primary)
        try {
          const url = new URL('https://api.mymemory.translated.net/get');
          url.searchParams.append('q', textToTranslate);
          url.searchParams.append('langpair', 'auto|' + apiLang);
          
          console.log('[AITools] Calling MyMemory API');
          const response = await fetch(url);
          const data = await response.json();
          
          console.log('[AITools] MyMemory response status:', data?.responseStatus);
          
          if (data?.responseData?.translatedText && 
              data.responseData.translatedText.length > 0 && 
              data.responseData.translatedText.toLowerCase() !== textToTranslate.toLowerCase() &&
              !data.responseData.translatedText.includes('QUERY LENGTH') &&
              !data.responseData.translatedText.includes('error')) {
            console.log('[AITools] Translation successful via MyMemory');
            sendResponse({ success: true, text: data.responseData.translatedText });
            return;
          } else {
            console.log('[AITools] MyMemory response invalid:', data?.responseData?.translatedText?.substring(0, 100));
          }
        } catch (e1) {
          console.log('[AITools] MyMemory failed:', e1.message);
        }
        
        // Fallback: try Reverso API
        try {
          const reversoUrl = 'https://api.reverso.net/translate/text/json?language_from=auto' +
            '&language_to=' + apiLang + '&input=' + encodeURIComponent(textToTranslate);
          
          console.log('[AITools] Calling Reverso API');
          const reversoResponse = await fetch(reversoUrl);
          const reversoData = await reversoResponse.json();
          
          console.log('[AITools] Reverso translation[0]:', reversoData?.translation?.[0]?.substring(0, 100));
          
          if (reversoData?.translation && 
              reversoData.translation.length > 0 &&
              !reversoData.translation[0].includes('QUERY LENGTH') &&
              !reversoData.translation[0].includes('error') &&
              reversoData.translation[0].toLowerCase() !== textToTranslate.toLowerCase()) {
            console.log('[AITools] Translation successful via Reverso');
            sendResponse({ success: true, text: reversoData.translation[0] });
            return;
          } else {
            console.log('[AITools] Reverso response invalid');
          }
        } catch (e2) {
          console.log('[AITools] Reverso API failed:', e2.message);
        }
        
        // All APIs failed
        console.log('[AITools] All translation APIs failed or returned errors');
        sendResponse({ success: false, error: 'Translation service unavailable - APIs returned errors' });
        
      } catch (e) {
        console.error('[AITools] Translation error:', e.message);
        sendResponse({ success: false, error: e.message });
      }
    })();
    
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AITools] Extension installed v4.0');
    chrome.storage.local.set({
      extensionEnabled: true,
      darkModeEnabled: false,
      readingTimeEnabled: true,
      blockSponsoredEnabled: false
    });
  }
});
