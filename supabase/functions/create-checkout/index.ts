import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request);
    const { plan } = await request.json();
    const priceId = priceForPlan(plan);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
    const admin = adminClient();
    const { data: subscriptions, error } = await admin.from('subscriptions').select('provider_customer_id').eq('user_id', user.id).not('provider_customer_id', 'is', null).limit(1);
    if (error) throw error;
    let customerId = subscriptions?.[0]?.provider_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: requiredEnv('BILLING_SUCCESS_URL'),
      cancel_url: requiredEnv('BILLING_CANCEL_URL'),
      subscription_data: { metadata: { supabase_user_id: user.id, plan } },
      metadata: { supabase_user_id: user.id, plan }
    });
    if (!session.url) throw new Error('Stripe n’a pas retourné d’URL de checkout.');
    return json({ url: session.url });
  } catch (error) { return json({ error: String(error?.message || error) }, 400); }
});

function adminClient() { return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } }); }
async function requireUser(request: Request) { const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) throw new Error('Authentification requise.'); const { data, error } = await adminClient().auth.getUser(token); if (error || !data.user) throw new Error('Session utilisateur invalide.'); return data.user; }
function priceForPlan(plan: string) { if (plan === 'pro') return requiredEnv('STRIPE_PRICE_PRO'); if (plan === 'max') return requiredEnv('STRIPE_PRICE_MAX'); throw new Error('Plan invalide.'); }
function requiredEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`Variable ${name} manquante.`); return value; }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
