'use strict';
const assert = require('node:assert/strict');
const {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  parseCookies,
  getEntitlement,
  safeNext,
  handleProtectedAppRoute
} = require('../lib/saas-auth');

const now = Date.parse('2026-11-20T12:00:00.000Z');
assert.equal(parseCookies('a=1; ar_access=abc.xyz; ar_refresh=r%3D1')[COOKIE_ACCESS], 'abc.xyz');
assert.equal(parseCookies('a=1; ar_access=abc; ar_refresh=refresh')[COOKIE_REFRESH], 'refresh');
assert.equal(safeNext('/campaigns'), '/campaigns');
assert.equal(safeNext('//evil.example'), '/dashboard');
assert.equal(safeNext('/api/auth/session'), '/dashboard');
assert.equal(getEntitlement({ status: 'trialing', plan_id: 'trial', trial_ends_at: new Date(now + 1).toISOString() }, now).allowed, true);
assert.equal(getEntitlement({ status: 'trialing', plan_id: 'trial', trial_ends_at: new Date(now).toISOString() }, now).allowed, false);
assert.equal(getEntitlement({ status: 'active', plan_id: 'pro', current_period_end: new Date(now + 60000).toISOString() }, now).allowed, true);
assert.equal(getEntitlement({ status: 'active', plan_id: 'pro', current_period_end: new Date(now - 1).toISOString() }, now).allowed, false);

async function checkProtectedRoute() {
  const old = {
    demo: process.env.DEMO_MODE,
    node: process.env.NODE_ENV,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLISHABLE_KEY,
    origin: process.env.APP_ORIGIN,
    fetch: global.fetch
  };
  process.env.DEMO_MODE = 'false';
  process.env.NODE_ENV = 'production';
  process.env.SUPABASE_URL = 'https://analisa-roi.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  process.env.APP_ORIGIN = 'https://analisa-roi.example';
  const subscription = {
    status: 'trialing', plan_id: 'trial',
    trial_ends_at: new Date(Date.now() - 1000).toISOString(),
    current_period_end: null
  };
  global.fetch = async input => {
    const url = String(input);
    const data = url.includes('/auth/v1/user')
      ? { id: 'user-1', email: 'test@example.com', user_metadata: {} }
      : [subscription];
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; }
  };
  const req = {
    method: 'GET',
    url: '/api/app?route=%2Fdashboard',
    query: { route: '/dashboard' },
    headers: {
      host: 'analisa-roi.example',
      cookie: `${COOKIE_ACCESS}=valid-access; ${COOKIE_REFRESH}=valid-refresh`
    }
  };
  await handleProtectedAppRoute(req, res);
  assert.equal(res.statusCode, 303, 'Trial vencido deve ser bloqueado no servidor.');
  assert.equal(res.headers.Location, '/plans?reason=trial_expired');
  assert.equal(res.body, undefined, 'A tela privada não deve ser entregue após o vencimento.');
  for (const [key, value] of Object.entries({ DEMO_MODE: old.demo, NODE_ENV: old.node, SUPABASE_URL: old.url, SUPABASE_PUBLISHABLE_KEY: old.key, APP_ORIGIN: old.origin })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  global.fetch = old.fetch;
}

checkProtectedRoute().then(() => console.log('SaaS auth: Trial vencido bloqueado no servidor; sessões e redirecionamento validados.'));
