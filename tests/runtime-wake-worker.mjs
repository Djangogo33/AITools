const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const target = targets.find((item) => /\/popup\/index\.html$/.test(item.url));
if (!target) throw new Error('Le popup AITools est introuvable.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
const result = await command('Runtime.evaluate', { expression: `new Promise((resolve) => chrome.runtime.sendMessage({ type: 'pomodoro/get' }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message || 'sans réponse' })))`, returnByValue: true, awaitPromise: true });
ws.close();
if (!result.result.value?.ok) throw new Error(result.result.value?.error || 'Le service worker ne répond pas.');
console.log('runtime worker wake: ok');
