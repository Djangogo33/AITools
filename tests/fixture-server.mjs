import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('./fixtures/', import.meta.url).pathname;
const port = Number(process.env.PORT || 8091);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  try {
    const path = normalize(request.url === '/' ? '/content-edge-cases.html' : request.url.split('?')[0]).replace(/^[/\\]+/, '');
    if (path.includes('..')) throw new Error('Chemin invalide');
    const file = await readFile(join(root, path));
    response.writeHead(200, { 'content-type': types[extname(path)] || 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    response.end(file);
  } catch { response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('Introuvable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`fixtures disponibles sur http://127.0.0.1:${port}`));
