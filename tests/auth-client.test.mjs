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

const { signInWithGoogle, isFeatureAllowed, signOut } = await import('../shared/auth-client.js');
const account = await signInWithGoogle();
assert.equal(account.authenticated, true);
assert.equal(account.user.email, 'alex@example.com');
assert.equal(account.plan, 'pro');
assert.equal(await isFeatureAllowed('note_sync'), true);
assert.equal(await isFeatureAllowed('ai_chat'), false);
const guest = await signOut();
assert.equal(guest.authenticated, false);
assert.ok(requests.some(({ url }) => url.includes('/auth/v1/logout')));
console.log('auth-client integration simulation: ok');
