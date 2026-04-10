// AITools AI Service - OpenAI ChatGPT Integration
// v4.1.0 - Supports both Prompt API (Nano) and OpenAI API

// ============================================================================
// CONFIGURATION - OpenAI API Integration
// ============================================================================
const OPENAI_API_KEY = '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';
const OPENAI_MODEL = 'gpt-4o-mini'; // Fast and cheap

// Internal message listener setup
let messageResponseHandlers = new Map();
let messageIdCounter = 0;

/**
 * Setup message listener for responses from injected script
 */
function setupMessageListener() {
  if (window.__aiServiceSetup) return;
  
  window.__aiServiceSetup = true;
  
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const message = event.data;
    if (!message.type || !message.type.startsWith('AITOOLS_')) return;
    
    // Handle AI responses
    if (message.type === 'AITOOLS_SUMMARIZE_RESPONSE' || 
        message.type === 'AITOOLS_TRANSLATE_RESPONSE') {
      const handler = messageResponseHandlers.get(message.messageId);
      if (handler) {
        handler(message);
        messageResponseHandlers.delete(message.messageId);
      }
    }
  });
}

/**
 * Send message to injected script and wait for response
 */
function sendMessageToInjectedScript(type, data, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const messageId = ++messageIdCounter;
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      messageResponseHandlers.delete(messageId);
      reject(new Error('Timeout waiting for AI response'));
    }, timeout);
    
    // Setup response handler
    messageResponseHandlers.set(messageId, (response) => {
      clearTimeout(timeoutId);
      
      if (response.success) {
        resolve(response.result);
      } else {
        reject(new Error(response.error || 'Unknown error'));
      }
    });
    
    // Send message to page script
    window.postMessage({
      type,
      messageId,
      ...data
    }, '*');
  });
}

/**
 * Classe pour gérer l'interaction avec la Prompt API (Gemini Nano)
 * Disponible dans Chrome 129+ avec chrome://flags/#prompt-api-for-gemini-nano
 */
class AIService {
  constructor() {
    this.session = null;
    this.isAvailable = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    setupMessageListener();
    
    // Auto-detect API availability
    this.detectAvailability();
    console.log('[AIService] ✅ Initialized with injected script communication');
  }

  /**
   * Auto-detect API availability with smart retry
   */
  async detectAvailability() {
    // Timeout rapide pour détection (5 secondes)
    try {
      const success = await Promise.race([
        this.testSummarize(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Detection timeout')), 5000)
        )
      ]);
      
      if (success) {
        this.isAvailable = true;
        console.log('[AIService] ✅ Prompt API is available!');
      } else {
        this.isAvailable = false;
        console.log('[AIService] ⚠️ Prompt API not available, using fallback');
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('[AIService] ⚠️ Prompt API unavailable:', error.message);
    }
  }

  /**
   * Test if Prompt API is really working
   */
  async testSummarize() {
    try {
      const result = await sendMessageToInjectedScript('AITOOLS_SUMMARIZE', {
        text: 'Test the API',
        length: 50
      }, 5000);  // 5 second timeout for testing
      
      return !!result;
    } catch (err) {
      return false;
    }
  }

  /**
   * Vérifier la disponibilité de l'API
   */
  async checkAvailability() {
    return this.isAvailable;
  }


  /**
   * Résumer un texte
   */
  async summarize(text, length = 35) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Input text cannot be empty');
      }

      console.log('[AIService] 📝 Summarizing text...');
      
      const result = await sendMessageToInjectedScript('AITOOLS_SUMMARIZE', {
        text,
        length
      });

      console.log('[AIService] ✅ Summarization successful');
      return result;

    } catch (error) {
      console.error('[AIService] ❌ Summarization failed:', error.message);
      return null;
    }
  }

  /**
   * Traduire un texte
   */
  async translate(text, targetLang = 'fr') {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Input text cannot be empty');
      }

      console.log('[AIService] 🌐 Translating to', targetLang);
      
      const result = await sendMessageToInjectedScript('AITOOLS_TRANSLATE', {
        text,
        targetLang
      });

      console.log('[AIService] ✅ Translation successful');
      return result;

    } catch (error) {
      console.error('[AIService] ❌ Translation failed:', error.message);
      return null;
    }
  }

  /**
   * Détecter si un texte est généré par IA
   */
  async detectAI(text, sensitivity = 60) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Input text cannot be empty');
      }

      console.log('[AIService] 🔍 Detecting AI-generated content');
      
      const result = await sendMessageToInjectedScript('AITOOLS_DETECT_AI', {
        text,
        sensitivity
      });

      console.log('[AIService] ✅ Detection successful');
      return result;

    } catch (error) {
      console.error('[AIService] ❌ Detection failed:', error.message);
      return null;
    }
  }

  /**
   * Générer une réponse via l'API Prompt
   * @param {string} userText - Texte à traiter
   * @param {Object} options - Options (timeout, systemPrompt)
   * @returns {Promise<string|null>} Réponse générée
   */
  async generateResponse(userText, options = {}) {
    const {
      timeout = 30000,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    try {
      if (!userText || userText.trim().length === 0) {
        throw new Error('Input text cannot be empty');
      }

      console.log('[AIService] 🤖 Generating response');
      
      const result = await sendMessageToInjectedScript('AITOOLS_GENERATE', {
        text: userText,
        systemPrompt
      }, timeout);

      console.log('[AIService] ✅ Response generated successfully');
      return result;

    } catch (error) {
      console.error('[AIService] ❌ Generation failed:', error.message);
      return null;
    }
  }

  /**
   * OpenAI API Call - Fallback when Prompt API unavailable
   * @param {string} text - Text to process
   * @param {string} task - 'summarize' or 'translate'
   * @param {number} length - Summary length %
   * @param {string} targetLang - Target language for translation
   */
  async callOpenAI(text, task = 'summarize', length = 35, targetLang = 'fr') {
    try {
      if (OPENAI_API_KEY === 'sk-proj-YOUR_KEY_HERE') {
        console.warn('[AIService] ⚠️ OpenAI API key not configured. Add your key to ai-service.js');
        return null;
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
              const waitTime = Math.pow(2, 3 - retries) * 1000; // 2s, 4s, 8s
              console.warn(`[AIService] ⏱️ Rate limit, retrying in ${waitTime/1000}s (${retries} left)...`);
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
            console.log(`[AIService] ✅ ${task} via OpenAI successful`);
            return result;
          } else {
            throw new Error('No content in response');
          }

        } catch (err) {
          lastError = err;
          retries--;
          if (retries > 0) {
            const waitTime = Math.pow(2, 3 - retries) * 1000;
            console.warn(`[AIService] ⏱️ Error: ${err.message}, retrying in ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      console.error('[AIService] ❌ OpenAI request failed after retries:', lastError?.message);
      return null;

    } catch (error) {
      console.error('[AIService] ❌ OpenAI request failed:', error.message);
      return null;
    }
  }

  /**
   * Résumer avec fallback OpenAI
   */
  async summarizeWithFallback(text, length = 35) {
    // Try Prompt API first
    if (this.isAvailable) {
      const result = await this.summarize(text, length);
      if (result) return result;
    }
    
    // Fallback to OpenAI
    console.log('[AIService] 📡 Falling back to OpenAI for summarization');
    return this.callOpenAI(text, 'summarize', length);
  }

  /**
   * Traduire avec fallback OpenAI
   */
  async translateWithFallback(text, targetLang = 'fr') {
    // Try Prompt API first
    if (this.isAvailable) {
      const result = await this.translate(text, targetLang);
      if (result) return result;
    }
    
    // Fallback to OpenAI
    console.log('[AIService] 📡 Falling back to OpenAI for translation');
    return this.callOpenAI(text, 'translate', 35, targetLang);
  }

  /**
   * Terminer la session proprement
   */
  async destroy() {
    try {
      this.session = null;
      console.log('[AIService] ✅ Session cleaned up');
    } catch (error) {
      console.error('[AIService] Error during cleanup:', error);
    }
  }
}

// Export singleton instance
const aiService = new AIService();
window.aiService = aiService;
console.log('[AIService] Singleton instance created');
