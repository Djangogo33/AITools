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
async function openNewTab() { const beforeTargets = await (await fetch(`${endpoint}/json/list`)).json(); const knownTargetIds = new Set(beforeTargets.map((item) => item.id)); const beforeTabs = await evaluate(`(async () => (await chrome.tabs.query({})).map(({ id, url }) => ({ id, url })))()`); const knownTabIds = new Set(beforeTabs.map((tab) => tab.id)); const createdTab = await evaluate(`chrome.tabs.create({ url: chrome.runtime.getURL('newtab/index.html'), active: true })`); let createdUrl; for (let attempt = 0; attempt < 16; attempt += 1) { const tabs = await evaluate(`(async () => (await chrome.tabs.query({})).map(({ id, url }) => ({ id, url })))()`); const candidate = tabs.find((tab) => tab.id === createdTab?.id) || tabs.find((tab) => !knownTabIds.has(tab.id)); createdUrl = candidate?.url; if (createdUrl && createdUrl !== `chrome-extension://${extensionId}/newtab/index.html`) break; await wait(500); } const allTargets = await (await fetch(`${endpoint}/json/list`)).json(); const devToolsUrls = allTargets.filter((item) => item.type === 'page' && !knownTargetIds.has(item.id)).map((item) => item.url); return [...new Set([...devToolsUrls, createdUrl].filter(Boolean))]; }
async function configure(settings) { const stored = await evaluate(`(async () => { await chrome.storage.local.set({ 'aitools.settings': ${JSON.stringify(settings)} }); return (await chrome.storage.local.get('aitools.settings'))['aitools.settings']; })()`); if (stored?.newTabDestination !== settings.newTabDestination || stored?.newTabSearchEngine !== settings.newTabSearchEngine) throw new Error('La préférence de nouvel onglet n’a pas été enregistrée avant le test.'); }

await configure({ newTabDestination: 'dashboard', newTabSearchEngine: 'google' });
const dashboardUrls = await openNewTab();
await configure({ newTabDestination: 'search', newTabSearchEngine: 'qwant' });
const searchUrls = await openNewTab();
await configure({ newTabDestination: 'native', newTabSearchEngine: 'google', featureFlags: {} });
const nativeUrls = await openNewTab();
await configure({ newTabDestination: 'dashboard', newTabSearchEngine: 'google', featureFlags: { 'newtab.dashboard': false } });
const disabledDashboardUrls = await openNewTab();
await configure({ newTabDestination: 'search', newTabSearchEngine: 'qwant', featureFlags: { 'newtab.search': false } });
const disabledSearchUrls = await openNewTab();
await configure({ newTabDestination: 'dashboard', newTabSearchEngine: 'google', featureFlags: {} });
socket.close();
const results = { dashboardUrls, searchUrls, nativeUrls, disabledDashboardUrls, disabledSearchUrls };
console.log(JSON.stringify(results, null, 2));
if (!dashboardUrls.includes(`chrome-extension://${extensionId}/newtab/index.html`)) throw new Error('Le tableau de bord AITools ne reste pas la destination par défaut.');
if (!searchUrls.some((url) => /^https:\/\/(?:www\.)?qwant\.com\//.test(url))) throw new Error('La destination Qwant ne redirige pas correctement.');
if (!nativeUrls.includes('chrome-search://local-ntp/local-ntp.html')) throw new Error('La destination Nouvel onglet Chrome natif ne redirige pas correctement.');
if (!disabledDashboardUrls.includes('chrome-search://local-ntp/local-ntp.html')) throw new Error('Un tableau de bord désactivé ne bascule pas vers le repli Chrome natif.');
if (!disabledSearchUrls.includes('chrome-search://local-ntp/local-ntp.html')) throw new Error('Une redirection moteur désactivée ne bascule pas vers le repli Chrome natif.');
console.log('runtime new tab destinations audit: ok');
