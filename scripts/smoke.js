const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = file => fs.readFileSync(file, 'utf8');

const html = read('index.html');
const landing = read('public/landing-mount.js');
const server = read('server.js');
const auth = read('lib/saas-auth.js');
const api = read('api/app.js');
const dashboard = read('public/dashboard.html');
const dashboardJs = read('public/dashboard.js');
const plans = read('plan-catalog.js');
const schema = read('supabase/bootstrap.sql');
const sales = read('sales.js');

for (const asset of ['/landing-copy.css', '/landing-template.js', '/landing-mount.js']) {
  assert.ok(html.includes(asset), `Landing page precisa carregar ${asset}.`);
}
assert.ok(landing.includes('href="/signup"'), 'Landing page deve levar novas contas ao cadastro.');
assert.ok(landing.includes("link.href = '/login'"), 'Landing page deve oferecer acesso à conta.');
assert.ok(server.includes("routePath === '/api/auth' || routePath.startsWith('/api/auth/')"), 'API de autenticação não está ligada ao servidor local.');
assert.ok(server.includes('getAuthContext(req, res)'), 'Rotas privadas devem consultar o backend no servidor.');
assert.ok(api.includes('handleProtectedAppRoute'), 'A função de produção deve proteger as rotas do painel.');
assert.ok(auth.includes('trialIsActive') && auth.includes('trial_ends_at'), 'Elegibilidade precisa depender da data de Trial armazenada no backend.');
assert.ok(auth.includes('getSubscription(userResult.user.id, accessToken)'), 'A sessão deve consultar a assinatura com o usuário autenticado.');
assert.ok(auth.includes("'/plans?reason=trial_expired'"), 'Sessões expiradas devem ser direcionadas para planos.');
assert.ok(dashboard.includes('data-trial-days'), 'A navegação deve ter um campo para exibir o tempo de Trial retornado pelo servidor.');
assert.ok(dashboardJs.includes('/api/auth/session'), 'O painel deve exibir o estado de acesso informado pelo servidor.');
assert.ok(dashboardJs.includes('location.assign("/logout")'), 'Sair deve encerrar a sessão pelo servidor.');
assert.ok(schema.includes('trial_started_at + interval \'7 days\''), 'O banco deve impor a duração exata de sete dias.');
assert.ok(schema.includes('create trigger on_auth_user_created_analisa_roi'), 'A criação de conta deve registrar o Trial no banco.');
assert.ok(schema.includes('enable row level security'), 'As tabelas públicas devem usar RLS.');
assert.ok(plans.includes("name: 'Basic', price: 47") && plans.includes("name: 'Pro', price: 97") && plans.includes("name: 'Scale', price: 247"), 'Catálogo demonstrativo deve manter os planos de referência.');
for (const term of ['faqItems', 'pricingSection', 'selectDemoPlan', 'pricing_plan_select', 'faq_expand']) {
  assert.ok(sales.includes(term), `Landing page deve manter ${term}.`);
}
assert.ok(fs.existsSync('public/brand/nemofy-symbol.svg'), 'Identidade visual Nemofy não foi encontrada.');
console.log('Smoke: landing page, autenticação, proteção de rotas, Trial backend e identidade encontrados.');
