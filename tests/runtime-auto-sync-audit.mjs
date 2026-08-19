const endpoint = 'http://127.0.0.1:9333';
const targets = await (await fetch(`${endpoint}/json/list`)).json();
const worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
const extensionId = worker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
if (!worker || !extensionId) throw new Error('Service worker AITools introuvable.');
const popup = targets.find((item) => item.type === 'page' && item.url === `chrome-extension://${extensionId}/popup/index.html`);
if (!popup) throw new Error('Popup AITools introuvable.');
async function connect(target) { const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); }); let sequence = 0; return { socket, evaluate(expression) { const id = ++sequence; return new Promise((resolve, reject) => { const listener = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; socket.removeEventListener('message', listener); if (message.error) reject(new Error(message.error.message)); else resolve(message.result.result?.value); }; socket.addEventListener('message', listener); socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); }); } }; }
const popupClient = await connect(popup);
await popupClient.evaluate(`chrome.storage.local.set({ 'aitools.settings': { featureFlags: { 'service.sync': true } }, 'aitools.tasks': [{ id: 'sync-audit-task', title: 'Sauvegarde automatique', updatedAt: new Date().toISOString() }] })`);
popupClient.socket.close();
await new Promise((resolve) => setTimeout(resolve, 250));
const workerClient = await connect(worker);
const alarm = await workerClient.evaluate(`chrome.alarms.get('aitools-personal-sync')`);
workerClient.socket.close();
console.log(JSON.stringify({ alarm }, null, 2));
if (!alarm?.scheduledTime) throw new Error('La sauvegarde automatique n’a pas été planifiée après une modification locale.');
console.log('runtime automatic sync audit: ok');
