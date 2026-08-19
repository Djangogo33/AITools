import { SUPABASE_CONFIG, SUPABASE_STORAGE_KEYS } from './supabase-config.js';

const CLOCK_SKEW_MS = 60_000;
const REQUEST_TIMEOUT_MS = 12_000;
const FREE_ENTITLEMENTS = ['local_tools', 'dark_mode', 'advanced_search', 'notes_local'];
const PLAN_ENTITLEMENTS = {
  free: FREE_ENTITLEMENTS,
  pro: [...FREE_ENTITLEMENTS, 'note_sync', 'custom_shortcuts', 'ai_summarizer', 'ai_translator'],
  max: [...FREE_ENTITLEMENTS, 'note_sync', 'custom_shortcuts', 'ai_summarizer', 'ai_translator', 'ai_chat', 'priority_features']
};

let refreshInFlight = null;
let refreshInFlightToken = null;

export async function signInWithGoogle() {
  const verifier = createCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  const redirectTo = chrome.identity.getRedirectURL('auth');
  await chrome.storage.local.set({ [SUPABASE_STORAGE_KEYS.pkceVerifier]: verifier });

  const authorizationUrl = new URL(`${SUPABASE_CONFIG.url}/auth/v1/authorize`);
  authorizationUrl.searchParams.set('provider', 'google');
  authorizationUrl.searchParams.set('redirect_to', redirectTo);
  authorizationUrl.searchParams.set('code_challenge', challenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authorizationUrl.toString(), interactive: true });
    const callback = new URL(responseUrl);
    const expectedRedirect = new URL(redirectTo);
    if (callback.origin !== expectedRedirect.origin || callback.pathname !== expectedRedirect.pathname) throw new Error('La redirection de connexion reçue est invalide.');
    const authError = callback.searchParams.get('error_description') || callback.searchParams.get('error');
    if (authError) throw new Error(authError);
    const code = callback.searchParams.get('code');
    if (!code) throw new Error('Le fournisseur de connexion n’a renvoyé aucun code d’autorisation.');
    const session = await exchangeCodeForSession(code, verifier);
    await persistSession(session);
    return await getAccount({ force: true });
  } finally {
    await chrome.storage.local.remove(SUPABASE_STORAGE_KEYS.pkceVerifier);
  }
}

export async function getAccount({ force = false } = {}) {
  const session = await getValidSession();
  if (!session) return createGuestAccount();
  const cached = (await chrome.storage.local.get(SUPABASE_STORAGE_KEYS.accountCache))[SUPABASE_STORAGE_KEYS.accountCache];
  if (!force && cached?.user?.id === session.user?.id && Date.now() - cached.cachedAt < 60_000) return cached;

  const [profileResult, subscriptionResult] = await Promise.allSettled([getOrCreateProfile(session), getSubscription(session)]);
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const subscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : { plan: 'free', entitlements: FREE_ENTITLEMENTS, expiresAt: null };
  const account = {
    authenticated: true,
    user: normalizeUser(session.user, profile),
    plan: subscription.plan,
    entitlements: subscription.entitlements,
    expiresAt: subscription.expiresAt,
    cachedAt: Date.now()
  };
  await chrome.storage.local.set({ [SUPABASE_STORAGE_KEYS.accountCache]: account });
  return account;
}

export async function getValidSession() {
  const stored = (await chrome.storage.local.get(SUPABASE_STORAGE_KEYS.session))[SUPABASE_STORAGE_KEYS.session];
  if (!stored?.access_token || !stored?.refresh_token) return null;
  if (Number(stored.expires_at || 0) - Date.now() > CLOCK_SKEW_MS) return stored;
  try {
    return await refreshStoredSession(stored);
  } catch {
    await clearSessionIfMatchingRefreshToken(stored.refresh_token);
    return null;
  }
}

export async function signOut() {
  const session = (await chrome.storage.local.get(SUPABASE_STORAGE_KEYS.session))[SUPABASE_STORAGE_KEYS.session];
  if (session?.access_token) {
    await fetchWithTimeout(`${SUPABASE_CONFIG.url}/auth/v1/logout`, { method: 'POST', headers: authHeaders(session.access_token) }).catch(() => undefined);
  }
  await clearSession();
  return createGuestAccount();
}

export async function isFeatureAllowed(feature) {
  const account = await getAccount();
  return account.entitlements.includes(feature);
}

async function exchangeCodeForSession(code, verifier) {
  const response = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ auth_code: code, code_verifier: verifier })
  });
  return parseSessionResponse(response, 'La connexion Supabase a échoué.');
}

async function refreshSession(refreshToken) {
  const response = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  return parseSessionResponse(response, 'La session a expiré. Veuillez vous reconnecter.');
}

async function getOrCreateProfile(session) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/profiles`);
  endpoint.searchParams.set('select', 'id,display_name,avatar_url,created_at');
  endpoint.searchParams.set('id', `eq.${session.user.id}`);
  const response = await fetchWithTimeout(endpoint, { headers: authHeaders(session.access_token) });
  if (!response.ok) throw await responseError(response, 'Impossible de récupérer le profil utilisateur.');
  const profiles = await response.json();
  if (!Array.isArray(profiles)) throw new Error('Réponse de profil invalide.');
  if (profiles[0]) return profiles[0];

  const metadata = session.user?.user_metadata || {};
  const createResponse = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/rest/v1/profiles?on_conflict=id`, {
    method: 'POST',
    headers: { ...authHeaders(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id: session.user.id, display_name: metadata.full_name || metadata.name || session.user.email?.split('@')[0] || 'Utilisateur', avatar_url: metadata.avatar_url || metadata.picture || null })
  });
  if (!createResponse.ok) throw await responseError(createResponse, 'Impossible de créer le profil utilisateur.');
  const created = await createResponse.json();
  return created[0] || null;
}

async function getSubscription(session) {
  const endpoint = new URL(`${SUPABASE_CONFIG.url}/rest/v1/subscriptions`);
  endpoint.searchParams.set('select', 'plan,status,current_period_end');
  endpoint.searchParams.set('user_id', `eq.${session.user.id}`);
  endpoint.searchParams.set('order', 'current_period_end.desc');
  endpoint.searchParams.set('limit', '1');
  const response = await fetchWithTimeout(endpoint, { headers: authHeaders(session.access_token) });
  if (!response.ok) return { plan: 'free', entitlements: FREE_ENTITLEMENTS, expiresAt: null };
  const payload = await response.json();
  if (!Array.isArray(payload)) return { plan: 'free', entitlements: FREE_ENTITLEMENTS, expiresAt: null };
  const [subscription] = payload;
  const plan = normalizePlan(subscription);
  return { plan, entitlements: PLAN_ENTITLEMENTS[plan], expiresAt: subscription?.current_period_end || null };
}

function normalizePlan(subscription) {
  const candidate = String(subscription?.plan || 'free').toLowerCase();
  const isCurrent = ['active', 'trialing'].includes(String(subscription?.status || '').toLowerCase()) && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
  return isCurrent && PLAN_ENTITLEMENTS[candidate] ? candidate : 'free';
}

async function refreshStoredSession(stored) {
  if (!refreshInFlight || refreshInFlightToken !== stored.refresh_token) {
    refreshInFlightToken = stored.refresh_token;
    refreshInFlight = refreshSession(stored.refresh_token).then(persistSession).finally(() => { refreshInFlight = null; refreshInFlightToken = null; });
  }
  return refreshInFlight;
}

async function persistSession(session) {
  const normalized = { ...session, expires_at: session.expires_at ? Number(session.expires_at) * 1000 : Date.now() + Number(session.expires_in || 3600) * 1000 };
  await chrome.storage.local.set({ [SUPABASE_STORAGE_KEYS.session]: normalized });
  return normalized;
}

async function clearSession() { await chrome.storage.local.remove([SUPABASE_STORAGE_KEYS.session, SUPABASE_STORAGE_KEYS.accountCache, SUPABASE_STORAGE_KEYS.pkceVerifier]); }
async function clearSessionIfMatchingRefreshToken(refreshToken) { const current = (await chrome.storage.local.get(SUPABASE_STORAGE_KEYS.session))[SUPABASE_STORAGE_KEYS.session]; if (current?.refresh_token === refreshToken) await clearSession(); }
function createGuestAccount() { return { authenticated: false, user: null, plan: 'free', entitlements: FREE_ENTITLEMENTS, expiresAt: null, cachedAt: Date.now() }; }
function normalizeUser(user, profile) { const metadata = user?.user_metadata || {}; return { id: user.id, email: user.email || '', name: profile?.display_name || metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Utilisateur', avatarUrl: profile?.avatar_url || metadata.avatar_url || metadata.picture || null }; }
function authHeaders(token) { return { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${token}` }; }
function jsonHeaders() { return { apikey: SUPABASE_CONFIG.publishableKey, 'Content-Type': 'application/json' }; }
async function parseSessionResponse(response, fallback) { if (!response.ok) throw await responseError(response, fallback); const session = await response.json(); if (!session?.access_token || !session?.refresh_token || !session?.user?.id) throw new Error('Réponse de session invalide.'); return session; }
async function fetchWithTimeout(url, options = {}) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS); try { return await fetch(url, { ...options, signal: controller.signal }); } catch (error) { if (error?.name === 'AbortError') throw new Error('La connexion à Supabase a expiré après 12 secondes.'); throw error; } finally { clearTimeout(timer); } }
async function responseError(response, fallback) { const payload = await response.json().catch(() => null); return new Error(payload?.msg || payload?.message || payload?.error_description || fallback); }
function createCodeVerifier() { const bytes = crypto.getRandomValues(new Uint8Array(64)); return base64Url(bytes); }
async function createCodeChallenge(verifier) { const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)); return base64Url(new Uint8Array(hash)); }
function base64Url(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
