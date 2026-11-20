const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
loadLocalEnvironment();
const saasAuth = require('./lib/saas-auth');
const runtimeConfig = saasAuth.getRuntimeConfig();
const preferredPort = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
const host = process.env.HOST || '127.0.0.1';
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
const dashboardRoutes = new Set([
  '/dashboard', '/campaigns', '/sales', '/visits', '/rules',
  '/integrations', '/notifications', '/placas', '/plans',
  '/support', '/account', '/settings', '/logout'
]);
const protectedDashboardRoutes = new Set([
  '/dashboard', '/campaigns', '/sales', '/visits', '/rules',
  '/integrations', '/notifications', '/placas', '/support',
  '/account', '/settings'
]);
const authPages = new Set(['/login', '/signup', '/recover', '/reset-password']);

function loadLocalEnvironment() {
  for (const name of ['.env', '.env.local']) {
    const file = path.join(__dirname, name);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || Object.hasOwn(process.env, match[1])) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(html);
}

async function serveRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const routePath = pathname.replace(/\/+$/, '') || '/';
  let file;

  if (routePath === '/api/auth' || routePath.startsWith('/api/auth/')) {
    return saasAuth.handleAuthApi(req, res);
  }

  if (routePath === '/auth/confirm') {
    req.url = `/api/auth/confirm${url.search}`;
    return saasAuth.handleAuthApi(req, res);
  }

  if (routePath === '/logout') {
    if (!runtimeConfig.demoMode) {
      await saasAuth.signOut(req, res);
      return saasAuth.redirect(res, '/login?logout=1');
    }
    file = path.join(root, 'public', 'dashboard.html');
  } else if (authPages.has(routePath)) {
    file = path.join(root, 'public', 'auth.html');
  } else if (routePath === '/plans' && !runtimeConfig.demoMode) {
    file = path.join(root, 'public', 'plans.html');
  } else if (protectedDashboardRoutes.has(routePath) && !runtimeConfig.demoMode) {
    const context = await saasAuth.getAuthContext(req, res);
    if (context.state === 'unauthenticated') return saasAuth.redirect(res, `/login?next=${encodeURIComponent(routePath)}`);
    if (context.state === 'expired') return saasAuth.redirect(res, '/plans?reason=trial_expired');
    if (context.state !== 'authorized') {
      return sendHtml(res, 503, '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Serviço indisponível · Nemofy</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;max-width:620px;margin:12vh auto;padding:24px;color:#13213b"><h1>Não foi possível validar seu acesso agora.</h1><p>Tente novamente em instantes. O painel permanece bloqueado até a confirmação do backend.</p><a href="/login">Voltar ao login</a></body></html>');
    }
    file = path.join(root, 'public', 'dashboard.html');
  } else if (routePath === '/dashboard.html' && !runtimeConfig.demoMode) {
    return saasAuth.redirect(res, '/dashboard');
  } else if (routePath === '/') {
    file = path.join(root, 'index.html');
  } else if (dashboardRoutes.has(routePath)) {
    file = path.join(root, 'public', 'dashboard.html');
  } else if (rootFiles.has(routePath)) {
    file = path.join(root, routePath.slice(1));
  } else if (path.extname(routePath)) {
    file = path.resolve(root, 'public', routePath.slice(1));
  } else {
    file = null;
  }

  if (!file || !file.startsWith(path.resolve(root) + path.sep)) {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    return res.end('Not found');
  }

  return new Promise(resolve => fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      res.end('Not found');
      return resolve();
    }

    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(data);
    resolve();
  }));
}

const server = http.createServer((req, res) => {
  serveRequest(req, res).catch(error => {
    console.error(`Falha ao atender requisição: ${error.message}`);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    }
    res.end('Internal server error');
  });
});

let port = preferredPort;
let retries = 0;
server.on('error', error => {
  if (['EADDRINUSE', 'EACCES'].includes(error.code) && port !== 0 && retries < 50) {
    const failedPort = port;
    retries += 1;
    port = preferredPort + retries;
    console.warn(`Porta ${failedPort} indisponível; tentando a próxima porta.`);
    server.listen(port, host);
    return;
  }

  console.error(`Não foi possível iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  const address = server.address();
  console.log(`Nemofy disponível em http://localhost:${address.port}`);
  console.log(`Dashboard: http://localhost:${address.port}/dashboard`);
  console.log(runtimeConfig.demoMode ? 'Modo demo local: ativo.' : 'Modo SaaS: autenticação e elegibilidade verificadas no servidor.');
});
