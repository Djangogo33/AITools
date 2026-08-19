const endpoint = 'http://127.0.0.1:9333';
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let targets = await (await fetch(`${endpoint}/json/list`)).json();
let worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
let extensionId = worker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
if (!extensionId) {
  const testExtensionId = 'ilcmhgapcepgkmeehflghjnciokgeein';
  await fetch(`${endpoint}/json/new?chrome-extension://${testExtensionId}/popup/index.html`, { method: 'PUT' });
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
async function openNewTab() { const before = await (await fetch(`${endpoint}/json/list`)).json(); const knownIds = new Set(before.map((item) => item.id)); await fetch(`${endpoint}/json/new?chrome-extension://${extensionId}/newtab/index.html`, { method: 'PUT' }); await wait(3_000); const all = await (await fetch(`${endpoint}/json/list`)).json(); return all.filter((item) => item.type === 'page' && !knownIds.has(item.id)).map((item) => item.url); }
async function configure(settings) { const stored = await evaluate(`(async () => { await chrome.storage.local.set({ 'aitools.settings': ${JSON.stringify(settings)} }); return (await chrome.storage.local.get('aitools.settings'))['aitools.settings']; })()`); if (stored?.newTabDestination !== settings.newTabDestination || stored?.newTabSearchEngine !== settings.newTabSearchEngine) throw new Error('La préférence de nouvel onglet n’a pas été enregistrée avant le test.'); }

await configure({ newTabDestination: 'dashboard', newTabSearchEngine: 'google' });
const dashboardUrls = await openNewTab();
await configure({ newTabDestination: 'search', newTabSearchEngine: 'qwant' });
const searchUrls = await openNewTab();
await configure({ newTabDestination: 'native', newTabSearchEngine: 'google' });
const nativeUrls = await openNewTab();
await configure({ newTabDestination: 'dashboard', newTabSearchEngine: 'google' });
socket.close();
const results = { dashboardUrls, searchUrls, nativeUrls };
console.log(JSON.stringify(results, null, 2));
if (!dashboardUrls.includes(`chrome-extension://${extensionId}/newtab/index.html`)) throw new Error('Le tableau de bord AITools ne reste pas la destination par défaut.');
if (!searchUrls.some((url) => /^https:\/\/(?:www\.)?qwant\.com\//.test(url))) throw new Error('La destination Qwant ne redirige pas correctement.');
if (!nativeUrls.includes('chrome-search://local-ntp/local-ntp.html')) throw new Error('La destination Nouvel onglet Chrome natif ne redirige pas correctement.');
console.log('runtime new tab destinations audit: ok');
