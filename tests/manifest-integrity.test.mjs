import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3, 'le manifeste doit rester en version 3');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'la version doit être sémantique');
assert.ok(manifest.action?.default_popup, 'un popup doit être déclaré');
assert.ok(manifest.background?.service_worker, 'un service worker doit être déclaré');
assert.equal(manifest.background.type, 'module', 'le service worker doit rester un module');
const referenced = [manifest.action.default_popup, manifest.background.service_worker, manifest.chrome_url_overrides?.newtab, manifest.options_ui?.page, ...Object.values(manifest.icons || {}), ...(manifest.content_scripts || []).flatMap((entry) => entry.js || [])].filter(Boolean);
for (const file of referenced) assert.equal(existsSync(resolve(root, file)), true, `fichier déclaré introuvable : ${file}`);
for (const file of ['popup/index.html', 'newtab/index.html', 'options/index.html']) { const content = readFileSync(resolve(root, file), 'utf8'); assert.equal(/https?:\/\/(?:fonts|cdn)\./i.test(content), false, `${file} ne doit pas charger de CDN de présentation`); }
assert.deepEqual(manifest.host_permissions, ['https://yvtukwaepqqsvacbbyou.supabase.co/*'], 'la seule permission d’hôte doit être Supabase');
assert.equal(new Set(Object.keys(manifest.commands || {})).size, 3, 'les trois raccourcis attendus doivent être déclarés');
console.log('manifest integrity simulation: ok');
