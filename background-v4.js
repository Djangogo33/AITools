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
    
    (async () => {
      try {
        if (!text) {
          sendResponse({ success: false, error: 'Empty text' });
          return;
        }
        
        const textToTranslate = text.length > 500 ? text.substring(0, 500) : text;
        
        // Try LibreTranslate first (free, no auth needed)
        try {
          const response = await fetch(
            'https://api.mymemory.translated.net/get',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                q: textToTranslate,
                langpair: `auto|${targetLang}`
              })
            }
          );
          
          const data = await response.json();
          
          if (data?.responseData?.translatedText && data.responseData.translatedText.length > 0 && data.responseData.translatedText !== textToTranslate) {
            sendResponse({ success: true, text: data.responseData.translatedText });
            return;
          }
        } catch (e1) {
          console.log('[AITools] MyMemory failed:', e1.message);
        }
        
        // Fallback: use simple reverso translation
        try {
          const reversoResponse = await fetch(
            `https://api.reverso.net/translate/text/json?language_from=auto&language_to=${targetLang}&variant=${targetLang === 'fr' ? 'fr' : 'en'}&input=${encodeURIComponent(textToTranslate)}`,
            { method: 'GET' }
          );
          
          const reversoData = await reversoResponse.json();
          if (reversoData?.translation && reversoData.translation.length > 0) {
            sendResponse({ success: true, text: reversoData.translation[0] });
            return;
          }
        } catch (e2) {
          console.log('[AITools] Reverso failed:', e2.message);
        }
        
        // All APIs failed
        sendResponse({ success: false, error: 'Translation service unavailable' });
        
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
