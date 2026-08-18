import { getValidSession } from './auth-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';

const REQUEST_TIMEOUT_MS = 12_000;

export async function createCheckout(plan) {
  if (!['pro', 'max'].includes(plan)) throw new Error('Plan de facturation invalide.');
  return invokeBillingFunction('create-checkout', { plan });
}

export async function createPortal() { return invokeBillingFunction('create-portal', {}); }

async function invokeBillingFunction(name, body) {
  const session = await getValidSession();
  if (!session?.access_token) throw new Error('Connectez-vous avant de gérer votre abonnement.');
  const response = await fetchWithTimeout(`${SUPABASE_CONFIG.url}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_CONFIG.publishableKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) { const payload = await response.json().catch(() => null); if (response.status === 404) throw new Error('Le service de facturation n’est pas encore déployé sur Supabase.'); throw new Error(payload?.error || 'Le service de facturation est indisponible.'); }
  const payload = await response.json();
  if (!payload?.url) throw new Error('Aucune URL de paiement n’a été renvoyée.');
  return payload.url;
}

async function fetchWithTimeout(url, options = {}) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS); try { return await fetch(url, { ...options, signal: controller.signal }); } catch (error) { if (error?.name === 'AbortError') throw new Error('Le service de facturation a expiré après 12 secondes.'); throw error; } finally { clearTimeout(timer); } }
