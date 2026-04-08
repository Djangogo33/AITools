// AITools AI Service - Gemini Nano Prompt API Integration
// v4.0.0

/**
 * Classe pour gérer l'interaction avec la Prompt API (Gemini Nano)
 * Disponible dans Chrome 129+ avec chrome://flags/#prompt-api-for-gemini-nano
 */
class AIService {
  constructor() {
    this.session = null;
    this.isAvailable = false;
    this.checkAvailability();
  }

  /**
   * Vérifier la disponibilité de l'API
   */
  async checkAvailability() {
    try {
      if (!window.ai || !window.ai.canCreateTextSession) {
        console.warn('[AIService] ⚠️ Prompt API not available in this browser');
        this.isAvailable = false;
        return false;
      }

      const canCreate = await window.ai.canCreateTextSession();
      console.log('[AIService] API Availability:', canCreate);
      
      this.isAvailable = canCreate !== 'no';
      return this.isAvailable;
    } catch (error) {
      console.error('[AIService] ❌ Availability check failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Générer une réponse via l'API Prompt
   * @param {string} userText - Texte à traiter
   * @param {Object} options - Options (timeout, onProgress, etc.)
   * @returns {Promise<string|Object>} Réponse générée
   */
  async generateResponse(userText, options = {}) {
    const {
      timeout = 30000,
      onProgress = null,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    try {
      // Vérifier que le texte n'est pas vide
      if (!userText || userText.trim().length === 0) {
        throw new Error('Input text cannot be empty');
      }

      // Vérifier la disponibilité
      const availability = await window.ai.canCreateTextSession();
      console.log('[AIService] Current availability:', availability);

      switch (availability) {
        case 'readily':
          return await this._createAndPrompt(userText, systemPrompt, timeout, onProgress);

        case 'after-download':
          console.log('[AIService] ⏳ Model downloading... please wait');
          if (onProgress) onProgress('Téléchargement du modèle en cours...');
          
          // Attendre le téléchargement
          await new Promise(resolve => {
            const checkInterval = setInterval(async () => {
              const status = await window.ai.canCreateTextSession();
              if (status === 'readily') {
                clearInterval(checkInterval);
                resolve();
              }
            }, 1000);

            // Timeout de 5 minutes
            setTimeout(() => clearInterval(checkInterval), 300000);
          });

          return await this._createAndPrompt(userText, systemPrompt, timeout, onProgress);

        case 'no':
          throw new Error(
            '❌ Prompt API not supported. Enable it:\n' +
            '1. Go to chrome://flags\n' +
            '2. Search "Prompt API for Gemini Nano"\n' +
            '3. Set to "Enabled"\n' +
            '4. Restart Chrome'
          );

        default:
          throw new Error(`Unknown availability status: ${availability}`);
      }

    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Créer la session et envoyer le prompt
   * @private
   */
  async _createAndPrompt(userText, systemPrompt, timeout, onProgress) {
    try {
      // Créer la session
      this.session = await window.ai.createTextSession();
      console.log('[AIService] ✅ Session created');

      if (onProgress) onProgress('Génération de la réponse...');

      // Ajouter le system prompt
      const fullPrompt = `${systemPrompt}\n\nUser: ${userText}`;

      // Créer une Promise avec timeout
      return await Promise.race([
        this.session.prompt(fullPrompt),
        this._timeoutPromise(timeout)
      ]);

    } catch (error) {
      if (error.message.includes('SecurityError')) {
        throw new Error('🔒 Accès refusé pour des raisons de sécurité');
      }
      if (error.message.includes('quota')) {
        throw new Error('⏱️ Quota dépassé. Veuillez réessayer plus tard');
      }
      throw error;
    }
  }

  /**
   * Créer une Promise qui reject après X ms
   * @private
   */
  _timeoutPromise(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Gérer les erreurs
   * @private
   */
  _handleError(error) {
    const errorMessage = error.message || 'Unknown error';
    console.error('[AIService] ❌ Error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Terminer la session proprement
   */
  async destroy() {
    if (this.session) {
      try {
        await this.session.destroy();
        this.session = null;
        console.log('[AIService] ✅ Session destroyed');
      } catch (error) {
        console.error('[AIService] Error destroying session:', error);
      }
    }
  }

  /**
   * Résumer un texte
   */
  async summarize(text, length = 35) {
    const systemPrompt = `You are a text summarizer. Summarize the following text in about ${length}% of its original length. 
Keep the main ideas and be concise. Reply only with the summary, no introduction.`;
    
    return await this.generateResponse(text, { systemPrompt });
  }

  /**
   * Traduire un texte
   */
  async translate(text, targetLang = 'fr') {
    const systemPrompt = `You are a translator. Translate the following text to ${targetLang}.
Reply only with the translation, no comments.`;
    
    return await this.generateResponse(text, { systemPrompt });
  }

  /**
   * Détecter si un texte est généré par IA
   */
  async detectAI(text, sensitivity = 60) {
    const systemPrompt = `You are an AI detector. Analyze this text and respond ONLY with a JSON object:
{"isAI": boolean, "confidence": 0-100, "reason": "brief explanation"}

Sensitivity level: ${sensitivity}/100`;

    const response = await this.generateResponse(text, { systemPrompt });
    
    try {
      return JSON.parse(response);
    } catch {
      return { isAI: false, confidence: 0, reason: 'Parse error' };
    }
  }
}

// Instance globale
window.aiService = new AIService();
console.log('[AIService] ✅ Loaded successfully');
