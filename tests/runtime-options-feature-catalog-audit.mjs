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
const options = await (await fetch(`${endpoint}/json/new?chrome-extension://${extensionId}/options/index.html`, { method: 'PUT' })).json();
const socket = new WebSocket(options.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
await wait(700);
let sequence = 0;
function evaluate(expression) { const id = ++sequence; return new Promise((resolve, reject) => { const listener = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; socket.removeEventListener('message', listener); if (message.error) reject(new Error(message.error.message)); else resolve(message.result.result?.value); }; socket.addEventListener('message', listener); socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); }); }
const result = await evaluate(`(async () => { const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); await delay(280); const control = document.querySelector('[data-feature-flag="media.inspect"]'); const reset = document.querySelector('#option-reset-features'); if (!control || !reset) return { missing: true }; const count = document.querySelectorAll('[data-feature-flag]').length; control.checked = false; control.dispatchEvent(new Event('change', { bubbles: true })); await delay(450); const disabled = (await chrome.storage.local.get('aitools.settings'))['aitools.settings']?.featureFlags?.['media.inspect']; reset.click(); await delay(450); const restored = (await chrome.storage.local.get('aitools.settings'))['aitools.settings']?.featureFlags?.['media.inspect']; return { count, disabled, restored }; })()`);
socket.close();
console.log(JSON.stringify(result, null, 2));
if (result?.missing || result?.count < 40 || result?.disabled !== false || result?.restored !== true) throw new Error('Le catalogue de personnalisation ne permet pas la désactivation et la restauration attendues.');
console.log('runtime options feature catalog audit: ok');
