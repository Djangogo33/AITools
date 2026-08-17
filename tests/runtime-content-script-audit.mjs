const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const target = targets.find((item) => item.type === 'service_worker' && /\/background\/service-worker\.js$/.test(item.url));
if (!target) throw new Error('Le service worker AITools est introuvable.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let sequence = 0;
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const onMessage = (event) => { const message = JSON.parse(event.data); if (message.id !== id) return; ws.removeEventListener('message', onMessage); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }; ws.addEventListener('message', onMessage); ws.send(JSON.stringify({ id, method, params })); }); }
const expression = `(async () => { const [tab] = await chrome.tabs.query({ url: 'https://example.com/*' }); if (!tab?.id) return { ok: false, error: 'Onglet example.com introuvable' }; try { const response = await chrome.tabs.sendMessage(tab.id, { type: 'page/capture-context' }); const summary = await chrome.tabs.sendMessage(tab.id, { type: 'page/summarize' }); return { ok: Boolean(response?.ok && summary?.ok), title: response?.title || '', chars: String(response?.text || '').length, summary: String(summary?.summary || ''), error: response?.error || summary?.error || null }; } catch (error) { return { ok: false, error: String(error?.message || error) }; } })()`;
const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
ws.close();
const audit = result.result.value;
console.log(JSON.stringify(audit, null, 2));
if (!audit?.ok || audit.chars < 20 || !/Example Domain/i.test(audit.title) || audit.summary.length < 20 || !audit.summary.includes('•')) throw new Error(`Le script de contenu ne répond pas correctement : ${audit?.error || 'réponse invalide'}`);
console.log('runtime content-script audit: ok');
