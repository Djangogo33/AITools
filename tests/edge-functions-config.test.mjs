import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../supabase/', import.meta.url);
const config = await readFile(new URL('config.toml', root), 'utf8');
const checkout = await readFile(new URL('functions/create-checkout/index.ts', root), 'utf8');
const portal = await readFile(new URL('functions/create-portal/index.ts', root), 'utf8');
const webhook = await readFile(new URL('functions/stripe-webhook/index.ts', root), 'utf8');

assert.match(config, /\[functions\.stripe-webhook\]\s*\nverify_jwt\s*=\s*false/);
for (const source of [checkout, portal, webhook]) assert.match(source, /import Stripe from 'npm:stripe@/);
assert.match(checkout, /requiredEnv\('STRIPE_SECRET_KEY'\)/);
assert.match(checkout, /requiredEnv\('STRIPE_PRICE_PRO'\)/);
assert.match(checkout, /requiredEnv\('STRIPE_PRICE_MAX'\)/);
assert.match(checkout, /requiredEnv\('BILLING_SUCCESS_URL'\)/);
assert.match(checkout, /requiredEnv\('BILLING_CANCEL_URL'\)/);
assert.match(portal, /requiredEnv\('BILLING_PORTAL_RETURN_URL'\)/);
assert.match(webhook, /constructEventAsync\(payload, signature, requiredEnv\('STRIPE_WEBHOOK_SECRET'\)/);
assert.match(webhook, /event\.type\.startsWith\('customer\.subscription\.'/);
assert.match(webhook, /event\.type === 'checkout\.session\.completed'/);
console.log('edge functions configuration simulation: ok');
