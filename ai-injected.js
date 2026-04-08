// AI Injected Script - Page context for Prompt API access
// This runs in the page's context, not the content script's context
// Allows direct access to window.ai (Gemini Nano)

console.log('[AIinjected] ✅ Injected script loaded');

// Listen for messages from content script
window.addEventListener('message', async (event) => {
  // Only accept messages from our content script
  if (event.source !== window) return;
  
  const message = event.data;
  if (!message.type || !message.type.startsWith('AITOOLS_')) return;

  console.log('[AIinjected] Received message:', message.type);

  // Handle AI requests
  if (message.type === 'AITOOLS_SUMMARIZE') {
    try {
      if (!window.ai || !window.ai.canCreateTextSession) {
        window.postMessage({
          type: 'AITOOLS_SUMMARIZE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not available'
        }, '*');
        return;
      }

      const availability = await window.ai.canCreateTextSession();
      if (availability === 'no') {
        window.postMessage({
          type: 'AITOOLS_SUMMARIZE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not supported'
        }, '*');
        return;
      }

      // Create session and summarize
      const session = await window.ai.createTextSession();
      const prompt = `Summarize this text in about ${message.length || 35}% of its original length. 
Keep key information and return ONLY the summary.

Text to summarize:
${message.text.substring(0, 3000)}`;

      const result = await Promise.race([
        session.prompt(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 30000)
        )
      ]);

      await session.destroy();

      window.postMessage({
        type: 'AITOOLS_SUMMARIZE_RESPONSE',
        messageId: message.messageId,
        success: true,
        result: result
      }, '*');
    } catch (error) {
      console.error('[AIinjected] Summarize error:', error);
      window.postMessage({
        type: 'AITOOLS_SUMMARIZE_RESPONSE',
        messageId: message.messageId,
        success: false,
        error: error.message
      }, '*');
    }
  }

  // Handle translation requests
  else if (message.type === 'AITOOLS_TRANSLATE') {
    try {
      if (!window.ai || !window.ai.canCreateTextSession) {
        window.postMessage({
          type: 'AITOOLS_TRANSLATE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not available'
        }, '*');
        return;
      }

      const availability = await window.ai.canCreateTextSession();
      if (availability === 'no') {
        window.postMessage({
          type: 'AITOOLS_TRANSLATE_RESPONSE',
          messageId: message.messageId,
          success: false,
          error: 'Prompt API not supported'
        }, '*');
        return;
      }

      // Create session and translate
      const session = await window.ai.createTextSession();
      const prompt = `Translate this text to ${message.targetLang}. Return ONLY the translation, no comments.

Text:
${message.text.substring(0, 2000)}`;

      const result = await Promise.race([
        session.prompt(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 30000)
        )
      ]);

      await session.destroy();

      window.postMessage({
        type: 'AITOOLS_TRANSLATE_RESPONSE',
        messageId: message.messageId,
        success: true,
        result: result
      }, '*');
    } catch (error) {
      console.error('[AIinjected] Translate error:', error);
      window.postMessage({
        type: 'AITOOLS_TRANSLATE_RESPONSE',
        messageId: message.messageId,
        success: false,
        error: error.message
      }, '*');
    }
  }
});

console.log('[AIinjected] Message listener ready');
