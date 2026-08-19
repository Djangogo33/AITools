const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
if (!worker) throw new Error('Service worker AITools introuvable.');
const fixture = targets.find((item) => item.type === 'page' && item.url.includes('/content-media.html'));
if (!fixture) throw new Error('Fixture média introuvable dans Chromium.');
const ws = new WebSocket(worker.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const listener = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', listener); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', listener); ws.send(JSON.stringify({ id, method, params })); }); }
await command('Runtime.enable');
const result = await command('Runtime.evaluate', { expression: `new Promise((resolve) => { chrome.tabs.query({ url: 'http://127.0.0.1:8091/content-media.html' }, ([tab]) => { if (!tab?.id) return resolve({ ok: false, error: 'Onglet fixture absent' }); chrome.tabs.sendMessage(tab.id, { type: 'page/get-media-info' }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message || 'sans réponse' })); }); })`, awaitPromise: true, returnByValue: true });
ws.close();
const data = result.result.value;
console.log(JSON.stringify(data, null, 2));
if (!data?.ok || data.counts?.images !== 1 || data.counts?.videos !== 1 || data.counts?.audios !== 1 || data.items?.length !== 3) throw new Error('Inventaire médias incorrect.');
console.log('runtime media audit: ok');
