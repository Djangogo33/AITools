// AITools Background Service Worker v4.0
importScripts('auth-supabase.js');

console.log('[AITools] Background worker initialized');

// Import du module d'authentification Supabase via importScripts
// Cela permet d'appeler directement loginWithGoogle(), verifyUserPlan(), etc.

// ============================================================================
// AUTHENTIFICATION ET GESTION DU PLAN UTILISATEUR
// ============================================================================

// Créer une alarme de vérification du plan toutes les 24h au démarrage
chrome.runtime.onStartup.addListener(() => {
  console.log('[AITools] Runtime startup - creating verification alarm');
  chrome.alarms.create('verify-user-plan', { periodInMinutes: 24 * 60 });
});

// Listener pour les alarmes (toutes les 24h, vérifier le plan de l'utilisateur)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'verify-user-plan') {
    console.log('[AITools] ⏰ Alarm triggered: verifying user plan...');
    
    try {
      // Récupérer l'utilisateur stocké
      const storage = await chrome.storage.local.get(['user']);
      
      if (!storage.user) {
        console.log('[AITools] No user logged in, skipping verification');
        return;
      }

      // Vérifier le plan via Supabase
      const planData = await verifyUserPlanOffline();
      console.log('[AITools] ✅ Plan verification successful:', planData.plan);
      
      // Mettre à jour le stockage avec le nouveau plan
      await chrome.storage.local.set({
        userPlan: planData,
        lastVerificationTime: new Date().toISOString(),
        isOffline: false
      });

    } catch (error) {
      console.error('[AITools] ❌ Plan verification failed:', error.message);
      
      // Fallback: Utiliser le plan mis en cache
      const storage = await chrome.storage.local.get(['userPlan']);
      if (storage.userPlan) {
        console.log('[AITools] ⚠️ Using cached plan (offline mode)');
        await chrome.storage.local.set({ isOffline: true });
      } else {
        console.log('[AITools] No cached plan, defaulting to free');
        await chrome.storage.local.set({
          userPlan: { plan: 'free', features: [], isActive: false },
          isOffline: true
        });
      }
    }
  }
});

// Fonction de vérification du plan (version offline-safe)
async function verifyUserPlanOffline() {
  const SUPABASE_URL = 'https://yvtukwaepqqsvacbbyou.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dHVrd2FlcHFxc3ZhY2JieW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjkxNDcsImV4cCI6MjA5NDg0NTE0N30.V_09OsFejHBTQ9ihlj9y6rDhDTLLkVGI9bPBIWmIUlc';
  
  try {
    const storage = await chrome.storage.local.get(['user']);
    
    if (!storage.user) {
      return { plan: 'free', features: [], isActive: false };
    }

    const userId = String(storage.user.id || storage.user.google_id || '').trim();
    const invalidUserId =
      !userId ||
      userId.toLowerCase() === 'undefined' ||
      userId.toLowerCase() === 'null';

    if (invalidUserId) {
      console.warn('[AITools] verifyUserPlanOffline: user.id manquant, fallback free');
      return { plan: 'free', features: [], isActive: false };
    }

    // Récupérer le plan depuis Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const subscriptions = await response.json();
    
    if (!subscriptions || subscriptions.length === 0) {
      return { plan: 'free', features: [], isActive: false };
    }

    const subscription = subscriptions[0];
    const expiryDate = new Date(subscription.expiry_date);
    const now = new Date();
    const isActive = expiryDate > now;

    if (!isActive) {
      return { plan: 'free', features: [], isActive: false };
    }

    const planFeatures = {
      'free': ['dark_mode', 'reading_time'],
      'pro': ['dark_mode', 'reading_time', 'advanced_search', 'note_sync', 'custom_shortcuts'],
      'max': ['dark_mode', 'reading_time', 'advanced_search', 'note_sync', 'custom_shortcuts', 'ai_chat', 'priority_support', 'priority_features']
    };

    return {
      plan: subscription.plan_type,
      features: planFeatures[subscription.plan_type] || [],
      expiryDate: subscription.expiry_date,
      stripeCustomerId: subscription.stripe_customer_id,
      isActive: true
    };
  } catch (error) {
    console.error('[AITools] Error verifying plan:', error.message);
    throw error;
  }
}

// Exécute la validation du code promo hors du listener principal.
async function executePromoValidation(promoCode, sendResponse) {
  const normalizedPromoCode = String(promoCode || '').trim().toUpperCase();

  try {
    if (!normalizedPromoCode) {
      sendResponse({ success: false, error: 'Code promo vide' });
      return;
    }

    const storage = await chrome.storage.local.get(['user']);
    if (!storage.user) {
      sendResponse({ success: false, error: 'Utilisateur non connecté' });
      return;
    }

    const userId = String(storage.user.id || storage.user.google_id || '');
    if (!userId) {
      sendResponse({ success: false, error: 'Identifiant utilisateur introuvable' });
      return;
    }

    const SUPABASE_URL = 'https://yvtukwaepqqsvacbbyou.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dHVrd2FlcHFxc3ZhY2JieW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjkxNDcsImV4cCI6MjA5NDg0NTE0N30.V_09OsFejHBTQ9ihlj9y6rDhDTLLkVGI9bPBIWmIUlc';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_promo_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_code: normalizedPromoCode
      })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const rpcError =
        result?.message ||
        result?.error_description ||
        result?.error ||
        'Code promo invalide';
      throw new Error(rpcError);
    }

    // Après avoir reçu `result` de l'appel RPC, forcer immédiatement la synchro locale.
    if (result && (result.success || result.new_plan === 'pro')) {
      // 1) Mettre à jour manuellement l'objet utilisateur local
      const userStorage = await chrome.storage.local.get(['user']);
      if (userStorage.user) {
        userStorage.user.plan = 'pro';
        await chrome.storage.local.set({ user: userStorage.user });
      }

      // 2) Forcer la structure `userPlan` attendue par l'interface
      const newPlanData = {
        plan: 'pro',
        features: ['dark_mode', 'reading_time', 'advanced_search', 'note_sync', 'custom_shortcuts'],
        isActive: true,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await chrome.storage.local.set({
        userPlan: newPlanData,
        lastPromoApplied: normalizedPromoCode,
        lastPromoTimestamp: new Date().toISOString(),
        isOffline: false
      });

      chrome.runtime.sendMessage({ action: 'ui-refresh-status', newPlan: 'pro' }).catch(() => {
        // On ignore l'erreur si la popup est fermée au moment de l'envoi
      });

      // 3) Répondre immédiatement avec les données forcées côté UI
      console.log('[AITools] ✅ Promo code applied (forced local sync):', normalizedPromoCode);
      sendResponse({ success: true, result, newPlan: newPlanData });
      return;
    }

    sendResponse({ success: false, error: 'Code promo appliqué mais plan non confirmé' });
  } catch (error) {
    console.error('[AITools] Promo code error:', error.message);
    sendResponse({ success: false, error: error.message || 'Erreur inconnue' });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ============================================================================
  // AUTH: LOGIN WITH GOOGLE
  // ============================================================================
  if (message.action === 'auth-login-google') {
    (async () => {
      try {
        // Appeler directement loginWithGoogle() depuis le module chargé par importScripts
        const user = await loginWithGoogle();
        
        // 1) Persister immédiatement l'objet utilisateur complet.
        await chrome.storage.local.set({
          user: user,
          lastLogin: new Date().toISOString()
        });

        // 2) Laisser le temps aux écritures/initialisations côté Supabase.
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Créer l'alarme de vérification immédiatement après connexion
        chrome.alarms.create('verify-user-plan', { periodInMinutes: 24 * 60 });
        
        // Vérifier le plan immédiatement
        let planData = await verifyUserPlanOffline();

        // 3) Fallback intelligent au tout premier login si la subscription n'est pas encore visible.
        const currentPlan = String(planData?.plan || '').toLowerCase();
        const planIsMissing = !planData || !planData.plan;
        const planIsImmediateFree = currentPlan === 'free';
        if (planIsMissing || planIsImmediateFree) {
          planData = {
            plan: user.plan || 'free',
            isActive: true,
            features: ['dark_mode', 'reading_time']
          };
        }

        await chrome.storage.local.set({
          userPlan: planData,
          isOffline: false
        });
        
        sendResponse({ success: true, user, plan: planData });
      } catch (error) {
        console.error('[AITools] Login error:', error.message);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // ============================================================================
  // AUTH: LOGOUT
  // ============================================================================
  if (message.action === 'auth-logout') {
    (async () => {
      try {
        await chrome.storage.local.remove(['user', 'accessToken', 'lastLogin', 'userPlan', 'lastPromoApplied']);
        console.log('[AITools] User logged out');
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // ============================================================================
  // AUTH: GET CURRENT USER
  // ============================================================================
  if (message.action === 'auth-get-user') {
    (async () => {
      try {
        const storage = await chrome.storage.local.get(['user', 'userPlan', 'isOffline']);
        sendResponse({
          success: true,
          user: storage.user || null,
          plan: storage.userPlan || { plan: 'FREE', features: [], isActive: false },
          isOffline: storage.isOffline || false
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // ============================================================================
  // AUTH: APPLY PROMO CODE
  // ============================================================================
  if (message.action === 'auth-apply-promo' || message.action === 'apply-promo') {
    const incomingCode = message.code || message.promoCode;
    executePromoValidation(incomingCode, sendResponse);
    return true;
  }

  // ============================================================================
  // AUTH: CHECK IF FEATURE AUTHORIZED
  // ============================================================================
  if (message.action === 'auth-check-feature') {
    (async () => {
      try {
        const { feature } = message;
        const storage = await chrome.storage.local.get(['userPlan']);
        const features = storage.userPlan?.features || [];
        const isAuthorized = features.includes(feature);
        
        console.log(`[AITools] Feature check: ${feature} = ${isAuthorized}`);
        sendResponse({ success: true, isAuthorized, feature });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Existing message listeners continue below...


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
