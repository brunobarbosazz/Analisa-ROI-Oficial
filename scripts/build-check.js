'use strict';
const fs = require('node:fs');
const path = require('node:path');

const required = [
  'index.html', 'landing-copy.css', 'styles.css', 'design.css', 'ux.css',
  'app.js', 'theme.js', 'ux.js', 'plan-catalog.js', 'sales.js', 'server.js',
  'lib/saas-auth.js', 'api/app.js', 'api/auth/[action].js', 'vercel.json',
  'public/dashboard.html', 'public/dashboard.js', 'public/dashboard-pages.js',
  'public/auth.html', 'public/auth.js', 'public/auth.css', 'public/plans.html',
  'public/landing-template.js', 'public/landing-mount.js', 'public/brand/nemofy-symbol.svg'
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Arquivo obrigatório ausente: ${file}`);

for (const file of [
  'app.js', 'theme.js', 'ux.js', 'plan-catalog.js', 'sales.js', 'server.js',
  'lib/saas-auth.js', 'api/app.js', 'api/auth/[action].js', 'scripts/build-check.js',
  'public/dashboard.js', 'public/dashboard-pages.js', 'public/auth.js', 'public/landing-mount.js'
]) new Function(fs.readFileSync(file, 'utf8'));

const out = path.join(process.cwd(), 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync('index.html', path.join(out, 'index.html'));
fs.copyFileSync('landing-copy.css', path.join(out, 'landing-copy.css'));
fs.cpSync('public', out, { recursive: true });
// The dashboard shell must only be returned by the entitlement-checked function.
fs.rmSync(path.join(out, 'dashboard.html'), { force: true });
console.log('Build: assets estáticos gerados em dist; dashboard fica atrás da verificação server-side.');
