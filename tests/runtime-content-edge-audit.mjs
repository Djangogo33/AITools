import assert from 'node:assert/strict';

const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const worker = targets.find((target) => target.type === 'service_worker' && /chrome-extension:\/\/[^/]+\/background\/service-worker\.js/.test(target.url));
if (!worker) throw new Error('Le service worker AITools est introuvable. Ouvrez le popup avant cet audit.');
const ws = new WebSocket(worker.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
const expression = `(async () => { const tabs = await chrome.tabs.query({ url: 'http://127.0.0.1:8091/*' }); const result = {}; for (const tab of tabs) { const text = await new Promise((resolve) => chrome.tabs.sendMessage(tab.id, { type: 'page/get-text' }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message }))); const summary = await new Promise((resolve) => chrome.tabs.sendMessage(tab.id, { type: 'page/summarize' }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message }))); result[new URL(tab.url).pathname] = { text: String(text?.text || ''), summary: String(summary?.summary || ''), ok: Boolean(text?.ok && summary?.ok), error: text?.error || summary?.error || null }; } return result; })()`;
const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
ws.close();
const audit = response.result.value;
console.log(JSON.stringify(audit, null, 2));
const noisy = audit['/content-edge-cases.html']; const short = audit['/content-short.html'];
assert.ok(noisy?.ok, noisy?.error || 'fixture bruitée indisponible');
assert.match(noisy.text, /fiabilité d’un outil/i);
assert.doesNotMatch(noisy.text, /BRUIT NAVIGATION|BRUIT LATÉRAL/i);
assert.match(noisy.summary, /^• /m);
assert.doesNotMatch(noisy.summary, /BRUIT NAVIGATION|BRUIT LATÉRAL/i);
assert.ok(short?.ok, short?.error || 'fixture courte indisponible');
assert.match(short.summary, /^• /m);
assert.equal(short.summary.split('\n').filter(Boolean).length, 1, 'un résumé très court doit tenir sur une puce cohérente');
assert.match(short.summary, /Mini note|Bref/i);
console.log('runtime content edge audit: ok');
