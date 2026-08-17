const [url, ...expected] = process.argv.slice(2);
if (!url || !expected.length) throw new Error('Usage : runtime-page-audit.mjs <url> <selector>...');
const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const target = targets.find((item) => item.url === url);
if (!target) throw new Error(`Page introuvable : ${url}`);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0; const events = [];
ws.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.method === 'Runtime.exceptionThrown' || message.method === 'Log.entryAdded') events.push(message); });
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
await command('Runtime.enable'); await command('Log.enable'); await command('Page.enable'); await command('Page.reload', { ignoreCache: true }); await new Promise((resolve) => setTimeout(resolve, 2500));
const serializedExpected = JSON.stringify(expected);
const result = await command('Runtime.evaluate', { expression: `(() => ({ readyState: document.readyState, title: document.title, missing: ${serializedExpected}.filter((selector) => !document.querySelector(selector)) }))()`, returnByValue: true });
ws.close();
const errors = events.filter((event) => event.method === 'Runtime.exceptionThrown' || event.params?.entry?.level === 'error').map((event) => event.params?.exceptionDetails?.text || event.params?.entry?.text || 'Erreur runtime');
const snapshot = result.result.value;
console.log(JSON.stringify({ url, snapshot, errors }, null, 2));
if (snapshot.readyState !== 'complete' || snapshot.missing.length || errors.length) throw new Error(`Audit runtime échoué pour ${url}`);
console.log('runtime page audit: ok');
