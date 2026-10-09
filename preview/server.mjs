import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  const requested = pathname === '/' ? 'index.html' : normalize(decodeURIComponent(pathname).replace(/^\/+/, ''));
  if (requested.startsWith('..')) { res.writeHead(403).end('Forbidden'); return; }
  try {
    const body = await readFile(join(root, requested));
    res.writeHead(200, { 'content-type': types[extname(requested)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});
server.listen(Number(process.env.PORT) || 4173, '0.0.0.0', () => console.log(`安心代駕 demo ready on port ${process.env.PORT || 4173}`));
