import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request); const admin = adminClient();
    const { data: subscriptions, error } = await admin.from('subscriptions').select('provider_customer_id').eq('user_id', user.id).not('provider_customer_id', 'is', null).limit(1);
    if (error) throw error;
    const customerId = subscriptions?.[0]?.provider_customer_id;
    if (!customerId) throw new Error('Aucun abonnement Stripe n’est associé à ce compte.');
    const stripe = new Stripe(requiredEnv('STRIPE_SECRET_KEY'));
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: requiredEnv('BILLING_PORTAL_RETURN_URL') });
    return json({ url: session.url });
  } catch (error) { return json({ error: String(error?.message || error) }, 400); }
});

function adminClient() { return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } }); }
async function requireUser(request: Request) { const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) throw new Error('Authentification requise.'); const { data, error } = await adminClient().auth.getUser(token); if (error || !data.user) throw new Error('Session utilisateur invalide.'); return data.user; }
function requiredEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`Variable ${name} manquante.`); return value; }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
