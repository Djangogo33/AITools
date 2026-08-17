import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) throw new Error('En-tête Stripe-Signature manquant.');
    const payload = await request.text();
    const stripe = new Stripe(requiredEnv('STRIPE_SECRET_KEY'), { httpClient: Stripe.createFetchHttpClient() });
    const event = await stripe.webhooks.constructEventAsync(payload, signature, requiredEnv('STRIPE_WEBHOOK_SECRET'), undefined, Stripe.createSubtleCryptoProvider());
    if (event.type.startsWith('customer.subscription.')) await syncSubscription(event.data.object as Stripe.Subscription);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) await syncSubscription(await stripe.subscriptions.retrieve(String(session.subscription)));
    }
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) await syncSubscription(await stripe.subscriptions.retrieve(String(invoice.subscription)));
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }
});

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;
  if (!userId) return;
  const plan = subscription.metadata.plan === 'max' ? 'max' : subscription.metadata.plan === 'pro' ? 'pro' : 'free';
  const status = mapStatus(subscription.status);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const admin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from('subscriptions').upsert({
    user_id: userId, plan, status, current_period_end: currentPeriodEnd,
    provider: 'stripe', provider_customer_id: String(subscription.customer), provider_subscription_id: subscription.id,
    updated_at: new Date().toISOString()
  }, { onConflict: 'provider_subscription_id' });
  if (error) throw error;
}

function mapStatus(status: Stripe.Subscription.Status) { return ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'].includes(status) ? status : 'expired'; }
function requiredEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`Variable ${name} manquante.`); return value; }
