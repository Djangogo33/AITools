import assert from 'node:assert/strict';

const store = new Map();
globalThis.chrome = { storage: { local: { async get(key) { return { [key]: store.get(key) }; }, async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); }, async remove(keys) { (Array.isArray(keys) ? keys : [keys]).forEach((key) => store.delete(key)); } } } };
store.set('aitools.auth.session', { access_token: 'access', refresh_token: 'refresh', expires_at: Date.now() + 3_600_000, user: { id: '00000000-0000-4000-8000-000000000001' } });
let status = 404;
globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Function not found' }), { status, headers: { 'content-type': 'application/json' } });
const { createCheckout, createPortal } = await import('../shared/billing-client.js');
await assert.rejects(() => createCheckout('free'), /invalide/i);
await assert.rejects(() => createCheckout('pro'), /pas encore déployé/i);
status = 200;
globalThis.fetch = async () => new Response(JSON.stringify({ url: 'https://checkout.stripe.test/session' }), { status, headers: { 'content-type': 'application/json' } });
assert.equal(await createPortal(), 'https://checkout.stripe.test/session');
console.log('billing-client simulation: ok');
