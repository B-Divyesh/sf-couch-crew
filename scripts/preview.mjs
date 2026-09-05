import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist');
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag === -1 ? 4173 : process.argv[portFlag + 1]);
const spaRoutes = new Set(['/demo', '/controller', '/privacy', '/terms']);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function fileForPath(pathname) {
  if (spaRoutes.has(pathname)) return join(root, 'index.html');
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = normalize(join(root, requested));
  return file.startsWith(`${root}/`) ? file : null;
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const requestedFile = fileForPath(pathname);
  const found = requestedFile && existsSync(requestedFile) && (await stat(requestedFile)).isFile();
  const file = found ? requestedFile : join(root, '404.html');
  const status = found ? 200 : 404;
  response.writeHead(status, {
    'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Couch Crew preview: http://127.0.0.1:${port}`);
});
