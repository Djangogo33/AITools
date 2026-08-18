import assert from 'node:assert/strict';

const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const worker = targets.find((target) => target.type === 'service_worker' && /chrome-extension:\/\/[^/]+\/background\/service-worker\.js/.test(target.url));
if (!worker) throw new Error('Le service worker AITools est introuvable. Ouvrez le popup avant cet audit.');
const ws = new WebSocket(worker.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
const expression = `(async () => { const [tab] = (await chrome.tabs.query({ url: 'http://127.0.0.1:8091/content-tools.html' })).sort((a, b) => b.id - a.id); if (!tab?.id) return { error: 'fixture outils introuvable' }; await chrome.tabs.reload(tab.id); await new Promise((resolve) => setTimeout(resolve, 900)); const send = (type) => new Promise((resolve) => chrome.tabs.sendMessage(tab.id, { type }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message }))); const focusOn = await send('page/toggle-focus'); const focusOff = await send('page/toggle-focus'); const darkOn = await send('page/toggle-dark'); const darkOff = await send('page/toggle-dark'); const cookies = await send('page/dismiss-cookies'); const anonymized = await send('page/anonymize'); const text = await send('page/get-text'); const sponsored = await send('page/block-sponsored'); const youtube = await send('page/youtube-theater'); return { focusOn, focusOff, darkOn, darkOff, cookies, anonymized, text, sponsored, youtube }; })()`;
const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
ws.close();
const audit = response.result.value;
console.log(JSON.stringify(audit, null, 2));
assert.equal(audit.focusOn?.ok, true); assert.equal(audit.focusOn?.enabled, true);
assert.equal(audit.focusOff?.ok, true); assert.equal(audit.focusOff?.enabled, false);
assert.equal(audit.darkOn?.ok, true); assert.equal(audit.darkOn?.enabled, true);
assert.equal(audit.darkOff?.ok, true); assert.equal(audit.darkOff?.enabled, false);
assert.equal(audit.cookies?.ok, true); assert.ok(audit.cookies.removed >= 1);
assert.equal(audit.anonymized?.ok, true); assert.ok(audit.anonymized.count >= 3);
assert.equal(audit.text?.ok, true); assert.match(audit.text.text, /\[email masqué\]/); assert.match(audit.text.text, /\[téléphone masqué\]/); assert.match(audit.text.text, /\[IP masquée\]/);
assert.equal(audit.sponsored?.ok, true); assert.equal(audit.sponsored.removed, 0);
assert.equal(audit.youtube?.ok, false); assert.match(audit.youtube.error, /YouTube/);
console.log('runtime page-tools audit: ok');
