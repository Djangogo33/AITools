// auth-supabase.js
// Module d'authentification pour AITools Pro v4.0
// Gère la connexion Google via OAuth2 et intégration Supabase

const SUPABASE_URL = 'https://yvtukwaepqqsvacbbyou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dHVrd2FlcHFxc3ZhY2JieW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjkxNDcsImV4cCI6MjA5NDg0NTE0N30.V_09OsFejHBTQ9ihlj9y6rDhDTLLkVGI9bPBIWmIUlc';
const GOOGLE_CLIENT_ID = '277196877247-sleq8im8phkhs4kqorflcpm448ki1f5i.apps.googleusercontent.com';
const REDIRECT_URL = chrome.identity.getRedirectURL();

/**
 * Lance le flux Google Sign-In via OAuth2 (MV3 compatible)
 */
async function loginWithGoogle() {
  try {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URL)}&` +
      `response_type=token&` +
      `scope=email%20profile`;

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    });

    // Extraire le token d'accès de l'URL de redirection
    const accessToken = new URL(responseUrl).hash
      .substring(1)
      .split('&')
      .reduce((acc, param) => {
        const [key, value] = param.split('=');
        if (key === 'access_token') acc = decodeURIComponent(value);
        return acc;
      }, null);

    if (!accessToken) {
      throw new Error('Pas de token reçu de Google');
    }

    // Échanger le token Google avec Supabase
    const user = await exchangeTokenWithSupabase(accessToken);
    
    // Stocker l'utilisateur localement
    await chrome.storage.local.set({ 
      user: user,
      accessToken: accessToken,
      lastLogin: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error('Erreur lors de la connexion Google:', error);
    throw error;
  }
}

/**
 * Échange le token Google avec Supabase pour créer/récupérer l'utilisateur
 */
async function exchangeTokenWithSupabase(googleAccessToken) {
  try {
    // Récupérer les infos Google de l'utilisateur
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${googleAccessToken}` }
    });

    if (!googleUserResponse.ok) {
      throw new Error('Impossible de récupérer les infos Google');
    }

    const googleUser = await googleUserResponse.json();

    // Vérifier si l'utilisateur existe déjà
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?google_id=eq.${googleUser.id}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (checkResponse.ok) {
      const existingUsers = await checkResponse.json();
      if (existingUsers.length > 0) {
        return existingUsers[0];
      }
    }

    // Créer un nouvel utilisateur si n'existe pas
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        email: googleUser.email,
        google_id: googleUser.id,
        name: googleUser.name,
        picture: googleUser.picture,
        plan: 'FREE',
        created_at: new Date().toISOString()
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Erreur Supabase:', errorText);
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }

    const newUser = await createResponse.json();
    return Array.isArray(newUser) ? newUser[0] : newUser;
  } catch (error) {
    console.error('Erreur lors de l\'échange token Supabase:', error);
    throw error;
  }
}

/**
 * Vérifie le plan de l'utilisateur (FREE, PRO, MAX)
 */
async function verifyUserPlan() {
  try {
    const storage = await chrome.storage.local.get(['user']);
    
    if (!storage.user) {
      return { plan: 'FREE', features: [], isActive: false };
    }

    const userId = storage.user.id;

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
      console.warn('Impossible de vérifier le plan, fallback FREE');
      return { plan: 'FREE', features: [], isActive: false };
    }

    const subscriptions = await response.json();
    
    if (!subscriptions || subscriptions.length === 0) {
      return { plan: 'FREE', features: [], isActive: false };
    }

    const subscription = subscriptions[0];
    
    // Vérifier l'expiration
    const expiryDate = new Date(subscription.expiry_date);
    const now = new Date();
    const isActive = expiryDate > now;

    if (!isActive) {
      return { plan: 'FREE', features: [], isActive: false };
    }

    // Retourner le plan avec les features activées
    const planFeatures = {
      'FREE': ['dark_mode', 'reading_time'],
      'PRO': ['dark_mode', 'reading_time', 'advanced_search', 'note_sync', 'custom_shortcuts'],
      'MAX': ['dark_mode', 'reading_time', 'advanced_search', 'note_sync', 'custom_shortcuts', 'ai_chat', 'priority_support', 'priority_features']
    };

    return {
      plan: subscription.plan_type,
      features: planFeatures[subscription.plan_type] || [],
      expiryDate: subscription.expiry_date,
      stripeCustomerId: subscription.stripe_customer_id,
      isActive: true
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du plan:', error);
    // En cas d'erreur, retourner FREE pour éviter les blocages
    return { plan: 'FREE', features: [], isActive: false };
  }
}

/**
 * Applique un code promo et met à jour le plan
 */
async function applyPromoCode(promoCode) {
  try {
    const storage = await chrome.storage.local.get(['user']);
    
    if (!storage.user) {
      throw new Error('Utilisateur non connecté');
    }

    const userId = storage.user.id;

    // Valider le code promo via Supabase (appel RPC ou endpoint)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_promo_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_code: promoCode.toUpperCase()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Code promo invalide ou expiré');
    }

    const result = await response.json();
    
    // Mettre à jour le stockage local
    await chrome.storage.local.set({ 
      lastPromoApplied: promoCode.toUpperCase(),
      lastPromoTimestamp: new Date().toISOString()
    });

    console.log('Code promo appliqué avec succès:', result);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'application du code promo:', error);
    throw error;
  }
}

/**
 * Récupère l'utilisateur stocké localement
 */
async function getStoredUser() {
  try {
    const storage = await chrome.storage.local.get(['user']);
    return storage.user || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Déconnecte l'utilisateur et efface les données de session
 */
async function logoutUser() {
  try {
    await chrome.storage.local.remove(['user', 'accessToken', 'lastLogin', 'lastPromoApplied', 'lastPromoTimestamp']);
    console.log('Déconnexion réussie');
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return false;
  }
}

/**
 * Récupère le token d'accès stocké
 */
async function getAccessToken() {
  try {
    const storage = await chrome.storage.local.get(['accessToken']);
    
    if (!storage.accessToken) {
      console.warn('Pas de token stocké');
      return null;
    }

    // TODO: Implémenter la logique de rafraîchissement du token si expiré
    return storage.accessToken;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
}

/**
 * Vérifie l'état de connexion
 */
async function isUserLoggedIn() {
  const user = await getStoredUser();
  return user !== null;
}

/**
 * Récupère les features autorisées selon le plan
 */
async function getAuthorizedFeatures() {
  const planData = await verifyUserPlan();
  return planData.features || [];
}

/**
 * Vérifie si une feature est autorisée pour l'utilisateur
 */
async function isFeatureAuthorized(featureName) {
  const features = await getAuthorizedFeatures();
  return features.includes(featureName);
}

/**
 * Retourne un objet avec le statut d'accès pour chaque feature
 */
async function getFeatureAccessMap() {
  const planData = await verifyUserPlan();
  
  const featureMap = {
    // Basiques (tous)
    'dark_mode': true,
    'reading_time': true,
    
    // PRO+ features
    'remove_ads': planData.plan !== 'FREE',
    'note_sync': planData.plan !== 'FREE',
    'advanced_search': planData.plan !== 'FREE',
    'ai_summarizer': planData.plan !== 'FREE',
    'ai_translator': planData.plan !== 'FREE',
    'custom_shortcuts': planData.plan !== 'FREE',
    'priority_support': planData.plan !== 'FREE',
    
    // MAX only
    'ai_chat': planData.plan === 'MAX',
    'priority_features': planData.plan === 'MAX'
  };
  
  return {
    plan: planData.plan,
    features: featureMap,
    planData: planData
  };
}

/**
 * Obtient le message de déverrouillage pour une feature
 */function getFeatureUpgradeMessage(featureName, currentPlan) {
  const messages = {
    'remove_ads': 'Upgrade PRO pour bloquer les publicités (4.99€/mois)',
    'note_sync': 'Upgrade PRO pour synchroniser vos notes (4.99€/mois)',
    'advanced_search': 'Upgrade PRO pour la recherche avancée (4.99€/mois)',
    'ai_summarizer': 'Upgrade PRO pour utiliser l\'IA Summarizer (4.99€/mois)',
    'ai_translator': 'Upgrade PRO pour utiliser l\'IA Translator (4.99€/mois)',
    'custom_shortcuts': 'Upgrade PRO pour les raccourcis personnalisés (4.99€/mois)',
    'ai_chat': 'Upgrade MAX pour accéder à l\'IA Chat (9.99€/mois)',
    'priority_features': 'Upgrade MAX pour les fonctionnalités prioritaires (9.99€/mois)',
    'priority_support': 'Upgrade PRO pour le support prioritaire (4.99€/mois)'
  };
  
  const targetPlan = featureName === 'ai_chat' || featureName === 'priority_features' ? 'MAX' : 'PRO';
  return messages[featureName] || `Upgrade ${targetPlan} pour accéder à cette fonctionnalité`;
}



// Exporter les fonctions pour utilisation dans les autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loginWithGoogle,
    exchangeTokenWithSupabase,
    verifyUserPlan,
    applyPromoCode,
    getStoredUser,
    logoutUser,
    getAccessToken,
    isUserLoggedIn,
    getAuthorizedFeatures,
    isFeatureAuthorized
  };
}
