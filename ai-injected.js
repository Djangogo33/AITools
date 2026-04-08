// AI Injected Script - Page context for Prompt API access
// This runs in the page's context, not the content script's context
// Allows direct access to window.ai (Gemini Nano)

console.log('[AIinjected] ✅ Injected script loaded');

// Check if API is available
const API_AVAILABLE = !!(window.ai && window.ai.canCreateTextSession);
console.log('[AIinjected] window.ai available:', API_AVAILABLE);

// Listen for messages from content script
window.addEventListener('message', async (event) => {
  // Only accept messages from our content script
  if (event.source !== window) return;
  
  const message = event.data;
  if (!message.type || !message.type.startsWith('AITOOLS_')) return;

  console.log('[AIinjected] Received message:', message.type, 'MessageId:', message.messageId);

  // Handle AI requests
  if (message.type === 'AITOOLS_SUMMARIZE') {
    try {
      if (!window.ai || !window.ai.canCreateTextSession) {
        console.warn('[AIinjected] Prompt API not available for summarization');
        window.postMessage({
          type: 'AITOOLS_SUMMARIZE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not available'
        }, '*');
        return;
      }

      const availability = await window.ai.canCreateTextSession();
      console.log('[AIinjected] Summarize availability:', availability);
      
      if (availability === 'no') {
        window.postMessage({
          type: 'AITOOLS_SUMMARIZE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not supported on this browser'
        }, '*');
        return;
      }

      // Create session and summarize
      console.log('[AIinjected] Creating AI session for summarization...');
      const session = await window.ai.createTextSession();
      const prompt = `Summarize this text in about ${message.length || 35}% of its original length. 
Keep key information and return ONLY the summary.

Text to summarize:
${message.text.substring(0, 3000)}`;

      console.log('[AIinjected] Sending prompt to Gemini...');
      const result = await Promise.race([
        session.prompt(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
        )
      ]);

      await session.destroy();

      console.log('[AIinjected] ✅ Summarization successful, sending response');
      window.postMessage({
        type: 'AITOOLS_SUMMARIZE_RESPONSE',
        messageId: message.messageId,
        success: true,
        result: result
      }, '*');
    } catch (error) {
      console.error('[AIinjected] ❌ Summarize error:', error);
      window.postMessage({
        type: 'AITOOLS_SUMMARIZE_RESPONSE',
        messageId: message.messageId,
        success: false,
        error: error.message || 'Unknown error'
      }, '*');
    }
  }

  // Handle translation requests
  else if (message.type === 'AITOOLS_TRANSLATE') {
    try {
      if (!window.ai || !window.ai.canCreateTextSession) {
        console.warn('[AIinjected] Prompt API not available for translation');
        window.postMessage({
          type: 'AITOOLS_TRANSLATE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not available'
        }, '*');
        return;
      }

      const availability = await window.ai.canCreateTextSession();
      console.log('[AIinjected] Translate availability:', availability);
      
      if (availability === 'no') {
        window.postMessage({
          type: 'AITOOLS_TRANSLATE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not supported on this browser'
        }, '*');
        return;
      }

      // Create session and translate
      console.log('[AIinjected] Creating AI session for translation...');
      const lang = message.targetLang || 'fr';
      const session = await window.ai.createTextSession();
      const prompt = `Translate this text to ${lang}. Return ONLY the translation, no comments or explanations.

Text to translate:
${message.text.substring(0, 2000)}`;

      console.log('[AIinjected] Sending translate prompt to Gemini...');
      const result = await Promise.race([
        session.prompt(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
        )
      ]);

      await session.destroy();

      console.log('[AIinjected] ✅ Translation successful, sending response');
      window.postMessage({
        type: 'AITOOLS_TRANSLATE_RESPONSE',
        messageId: message.messageId,
        success: true,
        result: result
      }, '*');
    } catch (error) {
      console.error('[AIinjected] ❌ Translate error:', error);
      window.postMessage({
        type: 'AITOOLS_TRANSLATE_RESPONSE',
        messageId: message.messageId,
        success: false,
        error: error.message || 'Unknown error'
      }, '*');
    }
  }
});

console.log('[AIinjected] Message listener ready');
