import assert from 'node:assert/strict';

const store = new Map();
const requests = [];
globalThis.chrome = {
  storage: {
    local: {
      async get(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(list.map((key) => [key, store.get(key)]));
      },
      async set(values) { Object.entries(values).forEach(([key, value]) => store.set(key, value)); },
      async remove(keys) { (Array.isArray(keys) ? keys : [keys]).forEach((key) => store.delete(key)); }
    }
  },
  identity: {
    getRedirectURL(path) { return `https://abcdefghijklmnop.chromiumapp.org/${path}`; },
    async launchWebAuthFlow({ url }) {
      assert.match(url, /provider=google/);
      assert.match(url, /code_challenge_method=S256/);
      return 'https://abcdefghijklmnop.chromiumapp.org/auth?code=demo-code';
    }
  }
};

globalThis.fetch = async (url, options = {}) => {
  requests.push({ url: String(url), options });
  if (String(url).includes('/auth/v1/token?grant_type=pkce')) {
    const body = JSON.parse(options.body);
    assert.equal(body.auth_code, 'demo-code');
    assert.ok(body.code_verifier.length > 40);
    return json({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { id: 'user-1', email: 'alex@example.com', user_metadata: { full_name: 'Alex Martin' } } });
  }
  if (String(url).includes('/rest/v1/profiles')) return json([{ id: 'user-1', display_name: 'Alex Martin', avatar_url: null }]);
  if (String(url).includes('/rest/v1/subscriptions')) return json([{ plan: 'pro', status: 'active', current_period_end: '2030-01-01T00:00:00Z' }]);
  throw new Error(`Unexpected request: ${url}`);
};

function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } }); }

const { signInWithGoogle, isFeatureAllowed, signOut, getAccount, getValidSession } = await import('../shared/auth-client.js');
const account = await signInWithGoogle();
assert.equal(account.authenticated, true);
assert.equal(account.user.email, 'alex@example.com');
assert.equal(account.plan, 'pro');
assert.equal(await isFeatureAllowed('note_sync'), true);
assert.equal(await isFeatureAllowed('ai_chat'), false);
const guest = await signOut();
assert.equal(guest.authenticated, false);
assert.ok(requests.some(({ url }) => url.includes('/auth/v1/logout')));

chrome.identity.launchWebAuthFlow = async () => 'https://redirect-inattendu.example/auth?code=ignored';
await assert.rejects(() => signInWithGoogle(), /redirection de connexion reçue est invalide/);

chrome.identity.launchWebAuthFlow = async () => { throw new Error('Authorization page could not be loaded.'); };
await assert.rejects(() => signInWithGoogle(), /Redirect URLs.*abcdefghijklmnop\.chromiumapp\.org\/auth/);

let refreshCalls = 0;
store.set('aitools.auth.session', { access_token: 'expired-access', refresh_token: 'expired-refresh', expires_at: Date.now() - 1, user: { id: 'user-1', email: 'alex@example.com', user_metadata: { full_name: 'Alex Martin' } } });
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes('/auth/v1/token?grant_type=refresh_token')) { refreshCalls += 1; return json({ access_token: 'renewed-access', refresh_token: 'renewed-refresh', expires_in: 3600, user: { id: 'user-1', email: 'alex@example.com', user_metadata: { full_name: 'Alex Martin' } } }); }
  throw new Error(`Unexpected request: ${url}`);
};
const refreshed = await Promise.all([getValidSession(), getValidSession(), getValidSession()]);
assert.equal(refreshCalls, 1);
assert.ok(refreshed.every((session) => session.access_token === 'renewed-access'));

store.delete('aitools.auth.account-cache');
globalThis.fetch = async (url) => {
  if (String(url).includes('/rest/v1/profiles') || String(url).includes('/rest/v1/subscriptions')) return json({ message: 'indisponible' }, 503);
  throw new Error(`Unexpected request: ${url}`);
};
const degradedAccount = await getAccount({ force: true });
assert.equal(degradedAccount.authenticated, true);
assert.equal(degradedAccount.user.name, 'Alex Martin');
assert.equal(degradedAccount.plan, 'free');
console.log('auth-client integration simulation: ok');
