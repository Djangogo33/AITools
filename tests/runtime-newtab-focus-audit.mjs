const endpoint = process.env.AITOOLS_CDP_ENDPOINT || 'http://127.0.0.1:9333';
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targets = await (await fetch(`${endpoint}/json/list`)).json();
const worker = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
const extensionId = worker?.url.match(/^chrome-extension:\/\/([^/]+)\//)?.[1];
if (!extensionId) throw new Error('Service worker AITools introuvable.');

async function connect(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const evaluate = (expression) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const listener = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; socket.removeEventListener('message', listener); if (message.error) reject(new Error(message.error.message)); else if (message.result.exceptionDetails) reject(new Error(message.result.exceptionDetails.text || 'Échec de Runtime.evaluate')); else resolve(message.result.result?.value); };
    socket.addEventListener('message', listener);
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  return { socket, evaluate };
}

const controlTarget = await (await fetch(`${endpoint}/json/new?${encodeURIComponent(`chrome-extension://${extensionId}/popup/index.html`)}`, { method: 'PUT' })).json();
const control = await connect(controlTarget);
await control.evaluate(`chrome.storage.local.set({ 'aitools.settings': { theme: 'dark', notifications: true, compactMode: false, pomodoroMinutes: 25, newTabDestination: 'dashboard', newTabSearchEngine: 'google', newTabCustomUrl: '', featureFlags: {} } })`);
control.socket.close();

const dashboardTarget = await (await fetch(`${endpoint}/json/new?${encodeURIComponent(`chrome-extension://${extensionId}/newtab/index.html`)}`, { method: 'PUT' })).json();
const dashboard = await connect(dashboardTarget);
await wait(700);
const dashboardFocus = await dashboard.evaluate(`({ activeId: document.activeElement?.id || '', searchVisible: Boolean(document.querySelector('#newtab-search')?.getClientRects().length) })`);
await dashboard.evaluate(`chrome.storage.local.set({ 'aitools.settings': { theme: 'dark', notifications: true, compactMode: false, pomodoroMinutes: 25, newTabDestination: 'search', newTabSearchEngine: 'google', newTabCustomUrl: '', featureFlags: {} } })`);
await dashboard.evaluate(`location.href = chrome.runtime.getURL('newtab/index.html')`);
dashboard.socket.close();

let googleTarget;
for (let attempt = 0; attempt < 20; attempt += 1) {
  await wait(400);
  const pages = await (await fetch(`${endpoint}/json/list`)).json();
  googleTarget = pages.find((item) => item.type === 'page' && /^https:\/\/www\.google\.com\//.test(item.url));
  if (googleTarget) break;
}
if (!googleTarget) throw new Error('La destination Google ne s’est pas ouverte.');
const google = await connect(googleTarget);
  await wait(2_000);
const googleFocus = await google.evaluate(`({ activeTag: document.activeElement?.tagName || '', activeName: document.activeElement?.getAttribute('name') || '', activeId: document.activeElement?.id || '' })`);
google.socket.close();

console.log(JSON.stringify({ dashboardFocus, googleFocus }, null, 2));
if (!dashboardFocus.searchVisible || dashboardFocus.activeId !== 'newtab-search') throw new Error('Le champ de recherche du tableau de bord ne reçoit pas le focus.');
if (!['q', 'sb_form_q', 'search_form_input', 'search_form_input_homepage'].includes(googleFocus.activeName) && !['sb_form_q', 'search_form_input', 'search_form_input_homepage'].includes(googleFocus.activeId)) throw new Error('Le champ de recherche Google ne reçoit pas le focus.');
console.log('runtime new tab focus audit: ok');
