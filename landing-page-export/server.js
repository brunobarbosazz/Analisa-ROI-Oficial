const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};
const rootFiles = new Set([
  '/styles.css', '/app.js', '/theme.js', '/design.css',
  '/ux.js', '/ux.css', '/plan-catalog.js', '/sales.js', '/sales.css'
]);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  let file;

  if (pathname === '/' || !path.extname(pathname)) {
    file = path.join(root, 'index.html');
  } else if (rootFiles.has(pathname)) {
    file = path.join(root, pathname.slice(1));
  } else {
    file = path.resolve(root, 'public', pathname.slice(1));
  }

  if (!file.startsWith(path.resolve(root) + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('Not found');
    }

    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(data);
  });
}).listen(port, host, () => console.log(`Vytrix demo disponível em http://${host}:${port}`));
