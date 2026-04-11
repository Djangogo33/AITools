// AITools AI Service - Gemini Nano + OpenAI Fallback
// v4.0.0 - Supports Prompt API (Nano) and OpenAI via Background Service Worker

// ============================================================================
// CONFIGURATION - OpenAI API Integration
// ============================================================================
const OPENAI_API_KEY = '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';
const OPENAI_MODEL = 'gpt-4o-mini';

// ============================================================================
// USER MODE PREFERENCE
// ============================================================================
let AI_MODE = 'free'; // 'free' (gratuit) ou 'smart' (IA)
// Charges depuis chrome.storage au démarrage

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
    
    // Load user's mode preference
    chrome.storage.local.get('aiMode', (data) => {
      AI_MODE = data.aiMode || 'free';
      console.log('[AIService] 📌 Mode chargé:', AI_MODE === 'free' ? '💰 Gratuit' : '🧠 IA Smart');
      
      // Only detect Nano in SMART mode
      if (AI_MODE === 'smart') {
        this.detectAvailability();
      }
    });
    
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
   * MyMemory API - Free translation, no auth needed, GET request (no CORS issues!)
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code (fr, en, es, etc)
   * @param {string} sourceLang - Source language (detects from page if not provided)
   */
  async callLibreTranslate(text, targetLang = 'fr', sourceLang = null) {
    try {
      console.log(`[AIService] 🌍 Calling MyMemory API for ${targetLang}...`);
      
      // Language code mapping (MyMemory uses: pt-PT, fr-FR, etc.)
      const langMap = {
        'pt': 'pt-PT', 'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES',
        'de': 'de-DE', 'it': 'it-IT', 'ja': 'ja-JP', 'zh': 'zh-CN'
      };
      
      // Auto-detect source language from page lang attribute
      if (!sourceLang) {
        const pageLang = document.documentElement.lang || 'en';
        sourceLang = pageLang.split('-')[0]; // 'pt-PT' → 'pt'
        console.log(`[AIService] 🔍 Auto-detected source language: ${sourceLang}`);
      }
      
      const sourceCode = langMap[sourceLang] || (sourceLang + '-' + sourceLang.toUpperCase());
      const targetCode = langMap[targetLang] || targetLang;
      
      // MyMemory MAX LIMIT: 500 chars (strict!)
      const textForAPI = text.substring(0, 500);
      const encoded = encodeURIComponent(textForAPI);
      
      console.log(`[AIService] 📝 Text to translate (${textForAPI.length} chars), ${sourceCode} → ${targetCode}`);
      
      // MyMemory API (GET request = no CORS issues)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceCode}|${targetCode}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AIService] 📨 MyMemory response status:`, data.responseStatus);
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const result = data.responseData.translatedText;
        
        // Validate result (not empty, reasonable length)
        if (result && result.trim().length > 0) {
          console.log(`[AIService] ✅ Translation via MyMemory successful (${result.length} chars)`);
          return result;
        }
      }
      
      console.warn('[AIService] MyMemory returned:', data);
      throw new Error('Translation API returned empty result');

    } catch (error) {
      console.error('[AIService] ⚠️ MyMemory/LibreTranslate failed:', error.message);
      return null;
    }
  }

  /**
   * OpenAI API Call via Background Service Worker (NO CORS ISSUES)
   * @param {string} text - Text to process
   * @param {string} task - 'summarize' or 'translate'
   * @param {number} length - Summary length %
   * @param {string} targetLang - Target language for translation
   */
  async callOpenAI(text, task = 'summarize', length = 35, targetLang = 'fr') {
    try {
      console.log(`[AIService] 📡 Sending ${task} request to Background Worker...`);
      
      // Use chrome.runtime.sendMessage to avoid CORS issues
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'callOpenAI',
            text,
            task,
            length,
            targetLang
          },
          (response) => {
            if (response && response.success) {
              console.log(`[AIService] ✅ ${task} via OpenAI successful`);
              resolve(response.result);
            } else {
              console.warn(`[AIService] ⚠️ OpenAI failed:`, response?.error);
              reject(new Error(response?.error || 'OpenAI request failed'));
            }
          }
        );
      });
    } catch (error) {
      console.error('[AIService] ❌ OpenAI call failed:', error.message);
      return null;
    }
  }

  /**
   * Résumer avec fallback basé sur le mode
   * Mode 'free': Heuristic seulement (local, zéro API)
   * Mode 'smart': Nano → OpenAI → null
   */
  async summarizeWithFallback(text, length = 35) {
    // Try Prompt API first (always)
    if (this.isAvailable) {
      const result = await this.summarize(text, length);
      if (result) return result;
    }
    
    // Mode-specific fallback
    if (AI_MODE === 'free') {
      // FREE MODE: Heuristic seulement (pas d'API)
      console.log('[AIService] 💰 Mode Gratuit: Utilisant heuristic local');
      return null; // Laisse content-v4.js utiliser betterSummarize
    } else {
      // SMART MODE: Try OpenAI
      console.log('[AIService] 🧠 Mode IA: Utilisant OpenAI');
      return this.callOpenAI(text, 'summarize', length);
    }
  }

  /**
   * Traduire avec fallback basé sur le mode
   * Mode 'free': LibreTranslate (gratuit) → null
   * Mode 'smart': Nano → OpenAI → null
   */
  async translateWithFallback(text, targetLang = 'fr') {
    // Try Prompt API first (always)
    if (this.isAvailable) {
      const result = await this.translate(text, targetLang);
      if (result) return result;
    }
    
    // Mode-specific fallback
    if (AI_MODE === 'free') {
      // FREE MODE: Use LibreTranslate (no cost, no auth)
      console.log('[AIService] 💰 Mode Gratuit: Utilisant LibreTranslate');
      return this.callLibreTranslate(text, targetLang);
    } else {
      // SMART MODE: Try OpenAI
      console.log('[AIService] 🧠 Mode IA: Utilisant OpenAI');
      return this.callOpenAI(text, 'translate', 35, targetLang);
    }
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

  /**
   * Changer les préférences - NOT USED (kept for compatibility)
   */
  static setPreferences(prefs) {
    console.log('[AIService] Note: Direct AI provider selection not implemented');
  }

  /**
   * Obtenir les préférences - NOT USED (kept for compatibility)
   */
  static getPreferences() {
    return { fallbackOnly: true };
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
try {
  console.log('[AIService] 🔧 About to create singleton instance...');
  const aiService = new AIService();
  console.log('[AIService] ✅ AIService instance created successfully');
  
  window.aiService = aiService;
  console.log('[AIService] 🌍 Assigned to window.aiService');
  console.log('[AIService] ✓ window.aiService exists:', typeof window.aiService);
  console.log('[AIService] ✓ window.aiService truthy:', !!window.aiService);
  console.log('[AIService] Singleton instance created');
} catch (error) {
  console.error('[AIService] ❌ FATAL: Failed to create singleton:', error);
  console.error('[AIService] Error stack:', error.stack);
}
