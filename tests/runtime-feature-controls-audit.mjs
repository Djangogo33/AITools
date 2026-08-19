const endpoint = 'http://127.0.0.1:9333';
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let targets = await (await fetch(`${endpoint}/json/list`)).json();
let worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
let extensionId = worker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
if (!extensionId) {
  extensionId = 'ilcmhgapcepgkmeehflghjnciokgeein';
  await fetch(`${endpoint}/json/new?chrome-extension://${extensionId}/popup/index.html`, { method: 'PUT' });
  await wait(400);
  targets = await (await fetch(`${endpoint}/json/list`)).json();
  worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
  extensionId = worker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
}
if (!extensionId) throw new Error('Service worker AITools introuvable.');
let popup = targets.find((item) => item.type === 'page' && item.url === `chrome-extension://${extensionId}/popup/index.html`);
if (!popup) popup = await (await fetch(`${endpoint}/json/new?chrome-extension://${extensionId}/popup/index.html`, { method: 'PUT' })).json();
const socket = new WebSocket(popup.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function evaluate(expression) { const id = ++sequence; return new Promise((resolve, reject) => { const listener = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; socket.removeEventListener('message', listener); if (message.error) reject(new Error(message.error.message)); else resolve(message.result.result?.value); }; socket.addEventListener('message', listener); socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); }); }
const result = await evaluate(`(async () => { const send = (type) => new Promise((resolve) => chrome.runtime.sendMessage({ type }, (response) => resolve(response || { ok: false, error: chrome.runtime.lastError?.message }))); await chrome.storage.local.set({ 'aitools.settings': { featureFlags: { 'media.inspect': false, 'productivity.tasks': false, 'productivity.pomodoro': false }, newTabDestination: 'dashboard', newTabSearchEngine: 'google' } }); await new Promise((resolve) => setTimeout(resolve, 220)); document.querySelector('#open-command-launcher').click(); await new Promise((resolve) => setTimeout(resolve, 30)); const snapshot = { mediaHidden: document.querySelector('#media-inspect').hidden, tasksHidden: document.querySelector('#view-tasks').hidden, commandHidesMedia: !document.querySelector('#command-list').textContent.includes('Inspecter les médias'), pomodoro: await send('pomodoro/get'), tasks: await send('tasks/list') }; await chrome.storage.local.set({ 'aitools.settings': { featureFlags: {}, newTabDestination: 'dashboard', newTabSearchEngine: 'google' } }); return snapshot; })()`);
socket.close();
console.log(JSON.stringify(result, null, 2));
if (!result?.mediaHidden || !result?.tasksHidden || !result?.commandHidesMedia || result?.pomodoro?.ok || result?.tasks?.ok || !/désactivée/.test(result?.pomodoro?.error || '') || !/désactivée/.test(result?.tasks?.error || '')) throw new Error('Les contrôles de fonctionnalité ne masquent ou ne bloquent pas correctement les outils désactivés.');
console.log('runtime feature controls audit: ok');
