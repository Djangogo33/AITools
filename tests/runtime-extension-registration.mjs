const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const target = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
if (!target) throw new Error('Le service worker AITools est introuvable dans Chromium.');
const extensionId = target.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
const result = await command('Runtime.evaluate', { expression: `({ manifest: chrome.runtime.getManifest(), id: chrome.runtime.id })`, returnByValue: true });
ws.close();
const runtime = result.result.value;
console.log(JSON.stringify({ extensionId, runtime }, null, 2));
if (runtime?.manifest?.name !== 'AITools' || runtime?.manifest?.version !== '7.0.0' || runtime.id !== extensionId) throw new Error('Le service worker chargé ne correspond pas au manifeste AITools 7.0.0.');
console.log('runtime extension registration: ok');
