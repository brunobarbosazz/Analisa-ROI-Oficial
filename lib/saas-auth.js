'use strict';

const COOKIE_ACCESS = 'ar_access';
const COOKIE_REFRESH = 'ar_refresh';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const MAX_BODY_BYTES = 16 * 1024;
const PROTECTED_ROUTES = new Set([
  '/dashboard', '/campaigns', '/sales', '/visits', '/rules',
  '/integrations', '/notifications', '/placas', '/support',
  '/account', '/settings'
]);

function getRuntimeConfig() {
  const explicitDemo = process.env.DEMO_MODE;
  const demoMode = explicitDemo === 'true' || (explicitDemo !== 'false' && process.env.NODE_ENV !== 'production');
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  const appOrigin = String(process.env.APP_ORIGIN || '').trim().replace(/\/$/, '');
  const deployedOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  return {
    demoMode,
    supabaseUrl,
    publishableKey,
    appOrigin: appOrigin || deployedOrigin,
    authConfigured: Boolean(supabaseUrl && publishableKey && (appOrigin || deployedOrigin || process.env.NODE_ENV !== 'production'))
  };
}

function parseCookies(header = '') {
  const result = Object.create(null);
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) result[name] = value;
  }
  return result;
}

function trialIsActive(subscription, now = Date.now()) {
  if (!subscription || subscription.status !== 'trialing') return false;
  const end = Date.parse(subscription.trial_ends_at || '');
  return Number.isFinite(end) && end > now;
}

function subscriptionIsActive(subscription, now = Date.now()) {
  if (!subscription || subscription.status !== 'active') return false;
  const end = Date.parse(subscription.current_period_end || '');
  return Number.isFinite(end) && end > now;
}

function getEntitlement(subscription, now = Date.now()) {
  if (trialIsActive(subscription, now)) {
    const end = Date.parse(subscription.trial_ends_at);
    return {
      allowed: true,
      status: 'trialing',
      plan: subscription.plan_id,
      expiresAt: new Date(end).toISOString(),
      daysRemaining: Math.max(1, Math.ceil((end - now) / 86400000))
    };
  }
  if (subscriptionIsActive(subscription, now)) {
    return {
      allowed: true,
      status: 'active',
      plan: subscription.plan_id,
      expiresAt: new Date(Date.parse(subscription.current_period_end)).toISOString(),
      daysRemaining: null
    };
  }
  return {
    allowed: false,
    status: subscription?.status === 'trialing' ? 'expired' : (subscription?.status || 'missing'),
    plan: subscription?.plan_id || null,
    expiresAt: subscription?.trial_ends_at || subscription?.current_period_end || null,
    daysRemaining: 0
  };
}

function requestOrigin(req) {
  const forwardedHost = req.headers?.['x-forwarded-host'];
  const host = forwardedHost || req.headers?.host;
  const forwardedProto = req.headers?.['x-forwarded-proto'];
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return host ? `${protocol}://${host}` : '';
}

function allowedAppOrigin(req) {
  const config = getRuntimeConfig();
  if (process.env.NODE_ENV !== 'production') return requestOrigin(req) || config.appOrigin || 'http://localhost:3000';
  return config.appOrigin || requestOrigin(req) || 'http://localhost:3000';
}

function requestHasSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return false;
  try {
    const expected = new URL(allowedAppOrigin(req));
    const actual = new URL(origin);
    return expected.host === actual.host && expected.protocol === actual.protocol;
  } catch {
    return false;
  }
}

function setSessionCookies(res, session) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const common = `; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
  res.setHeader('Set-Cookie', [
    `${COOKIE_ACCESS}=${session.access_token}${common}`,
    `${COOKIE_REFRESH}=${session.refresh_token}${common}`
  ]);
}

function clearSessionCookies(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${COOKIE_ACCESS}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    `${COOKIE_REFRESH}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
  ]);
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function redirect(res, location, status = 303) {
  res.statusCode = status;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

async function supabaseRequest(path, { method = 'GET', body, token, redirectTo } = {}) {
  const config = getRuntimeConfig();
  if (!config.authConfigured) {
    const error = new Error('Supabase Auth is not configured.');
    error.code = 'not_configured';
    throw error;
  }
  const url = new URL(`${config.supabaseUrl}/auth/v1/${path}`);
  if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
  const headers = {
    apikey: config.publishableKey,
    accept: 'application/json'
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = {}; }
  }
  return { ok: response.ok, status: response.status, data };
}

async function getUser(accessToken) {
  const result = await supabaseRequest('user', { token: accessToken });
  if (!result.ok) return { user: null, status: result.status };
  return { user: result.data, status: result.status };
}

async function refreshSession(refreshToken, res) {
  const result = await supabaseRequest('token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken }
  });
  if (!result.ok || !result.data?.access_token || !result.data?.refresh_token) return null;
  setSessionCookies(res, result.data);
  return result.data;
}

async function getSubscription(userId, accessToken) {
  const config = getRuntimeConfig();
  const query = new URLSearchParams({
    select: 'status,plan_id,trial_started_at,trial_ends_at,current_period_end,billing_interval',
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
    limit: '1'
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/subscriptions?${query}`, {
    headers: {
      apikey: config.publishableKey,
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json'
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Could not read subscription entitlement.');
  const data = await response.json();
  return Array.isArray(data) ? data[0] || null : null;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || ''
  };
}

async function getAuthContext(req, res) {
  const config = getRuntimeConfig();
  if (!config.authConfigured) return { state: 'unavailable', user: null, entitlement: null };
  const cookies = parseCookies(req.headers?.cookie);
  let accessToken = cookies[COOKIE_ACCESS];
  const refreshToken = cookies[COOKIE_REFRESH];
  if (!accessToken && !refreshToken) return { state: 'unauthenticated', user: null, entitlement: null };

  let userResult;
  try {
    if (accessToken) userResult = await getUser(accessToken);
    if ((!userResult?.user) && refreshToken) {
      const session = await refreshSession(refreshToken, res);
      if (session) {
        accessToken = session.access_token;
        userResult = await getUser(accessToken);
      }
    }
  } catch {
    return { state: 'unavailable', user: null, entitlement: null };
  }
  if (!userResult?.user) {
    clearSessionCookies(res);
    return { state: 'unauthenticated', user: null, entitlement: null };
  }

  try {
    const subscription = await getSubscription(userResult.user.id, accessToken);
    const entitlement = getEntitlement(subscription);
    return {
      state: entitlement.allowed ? 'authorized' : 'expired',
      user: publicUser(userResult.user),
      entitlement
    };
  } catch {
    return { state: 'unavailable', user: publicUser(userResult.user), entitlement: null };
  }
}

async function signOut(req, res) {
  const cookies = parseCookies(req.headers?.cookie);
  if (cookies[COOKIE_ACCESS]) {
    try { await supabaseRequest('logout', { method: 'POST', token: cookies[COOKIE_ACCESS] }); } catch {}
  }
  clearSessionCookies(res);
}

function safeNext(value, fallback = '/dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/api/')) return fallback;
  return value;
}

function actionFromRequest(req) {
  if (req.query?.action) return String(req.query.action);
  const url = new URL(req.url || '/', 'http://localhost');
  return url.pathname.replace(/\/+$/, '').split('/').pop() || '';
}

async function handleAuthApi(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const action = actionFromRequest(req);
  const config = getRuntimeConfig();

  if (action === 'config' && method === 'GET') {
    return json(res, 200, { demoMode: config.demoMode, authConfigured: config.authConfigured });
  }
  if (action === 'confirm' && method === 'GET') {
    const url = new URL(req.url || '/', allowedAppOrigin(req));
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    const allowedTypes = new Set(['email', 'signup', 'recovery', 'invite', 'magiclink', 'email_change']);
    if (!tokenHash || !allowedTypes.has(type)) return redirect(res, '/login?error=confirmation');
    try {
      const verified = await supabaseRequest('verify', {
        method: 'POST',
        body: { token_hash: tokenHash, type }
      });
      if (!verified.ok || !verified.data?.access_token) return redirect(res, '/login?error=confirmation');
      setSessionCookies(res, verified.data);
      return redirect(res, type === 'recovery' ? '/reset-password' : safeNext(url.searchParams.get('next')));
    } catch {
      return redirect(res, '/login?error=unavailable');
    }
  }
  if (action === 'session' && method === 'GET') {
    try {
      const context = await getAuthContext(req, res);
      if (context.state === 'unavailable') return json(res, 503, { error: 'auth_unavailable', state: context.state });
      if (context.state === 'expired') return json(res, 403, { state: context.state, user: context.user, entitlement: context.entitlement });
      return json(res, context.state === 'authorized' ? 200 : 401, context);
    } catch {
      return json(res, 503, { error: 'auth_unavailable' });
    }
  }

  if (['signup', 'login', 'logout', 'recover', 'password'].includes(action)) {
    if (!['POST', 'PUT'].includes(method)) return json(res, 405, { error: 'method_not_allowed' });
    if (!requestHasSameOrigin(req)) return json(res, 403, { error: 'origin_rejected' });
  } else {
    return json(res, 404, { error: 'not_found' });
  }

  if (!config.authConfigured) return json(res, 503, { error: 'auth_not_configured' });
  let body;
  try { body = await readJson(req); }
  catch (error) { return json(res, error.status || 400, { error: error.message }); }

  try {
    if (action === 'signup' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim().slice(0, 100);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
        return json(res, 400, { error: 'invalid_signup', message: 'Informe um e-mail válido e senha com ao menos 10 caracteres.' });
      }
      const origin = allowedAppOrigin(req);
      const confirmationUrl = new URL('/auth/confirm', origin);
      confirmationUrl.searchParams.set('next', safeNext(body.next));
      const result = await supabaseRequest('signup', {
        method: 'POST',
        redirectTo: confirmationUrl.toString(),
        body: { email, password, data: { full_name: name } }
      });
      if (!result.ok) return json(res, result.status >= 500 ? 502 : 400, { error: 'signup_failed', message: 'Não foi possível criar a conta. Revise os dados e tente novamente.' });
      if (result.data?.access_token && result.data?.refresh_token) {
        setSessionCookies(res, result.data);
        return json(res, 201, { state: 'authorized', confirmationRequired: false });
      }
      return json(res, 202, { state: 'confirmation_pending', confirmationRequired: true });
    }

    if (action === 'login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return json(res, 400, { error: 'invalid_credentials' });
      const result = await supabaseRequest('token?grant_type=password', {
        method: 'POST',
        body: { email, password }
      });
      if (!result.ok || !result.data?.access_token) return json(res, 401, { error: 'login_failed', message: 'E-mail/senha inválidos ou e-mail ainda não confirmado.' });
      setSessionCookies(res, result.data);
      const subscription = await getSubscription(result.data.user.id, result.data.access_token);
      const entitlement = getEntitlement(subscription);
      return json(res, 200, { state: entitlement.allowed ? 'authorized' : 'expired', entitlement, next: entitlement.allowed ? safeNext(body.next) : '/plans?reason=trial_expired' });
    }

    if (action === 'logout' && method === 'POST') {
      await signOut(req, res);
      return json(res, 200, { state: 'signed_out' });
    }

    if (action === 'recover' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'invalid_email' });
      const recoveryUrl = new URL('/auth/confirm', allowedAppOrigin(req));
      recoveryUrl.searchParams.set('next', '/reset-password');
      const result = await supabaseRequest('recover', {
        method: 'POST',
        redirectTo: recoveryUrl.toString(),
        body: { email }
      });
      if (!result.ok && result.status >= 500) return json(res, 502, { error: 'recovery_unavailable' });
      return json(res, 200, { state: 'recovery_requested' });
    }

    if (action === 'password' && method === 'PUT') {
      const password = String(body.password || '');
      if (password.length < 10 || password.length > 128) return json(res, 400, { error: 'invalid_password', message: 'Use uma senha com ao menos 10 caracteres.' });
      const cookies = parseCookies(req.headers?.cookie);
      let accessToken = cookies[COOKIE_ACCESS];
      let userResult = accessToken ? await getUser(accessToken) : { user: null };
      if (!userResult.user && cookies[COOKIE_REFRESH]) {
        const session = await refreshSession(cookies[COOKIE_REFRESH], res);
        accessToken = session?.access_token;
        userResult = accessToken ? await getUser(accessToken) : { user: null };
      }
      if (!accessToken || !userResult?.user) return json(res, 401, { error: 'unauthenticated' });
      const result = await supabaseRequest('user', { method: 'PUT', token: accessToken, body: { password } });
      if (!result.ok) return json(res, result.status >= 500 ? 502 : 400, { error: 'password_update_failed' });
      return json(res, 200, { state: 'password_updated' });
    }
  } catch (error) {
    if (error.code === 'not_configured') return json(res, 503, { error: 'auth_not_configured' });
    return json(res, 502, { error: 'auth_service_unavailable' });
  }
  return json(res, 405, { error: 'method_not_allowed' });
}

async function handleProtectedAppRoute(req, res) {
  const url = new URL(req.url || '/', allowedAppOrigin(req));
  const route = safeNext(String(req.query?.route || url.searchParams.get('route') || '/dashboard'), '');
  if (route === '/logout') {
    await signOut(req, res);
    return redirect(res, '/login?logout=1');
  }
  if (!PROTECTED_ROUTES.has(route)) return json(res, 404, { error: 'not_found' });

  const config = getRuntimeConfig();
  if (!config.demoMode) {
    const context = await getAuthContext(req, res);
    if (context.state === 'unauthenticated') return redirect(res, `/login?next=${encodeURIComponent(route)}`);
    if (context.state === 'expired') return redirect(res, '/plans?reason=trial_expired');
    if (context.state !== 'authorized') return json(res, 503, { error: 'entitlement_unavailable' });
  }

  let html;
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    html = fs.readFileSync(path.join(process.cwd(), 'public', 'dashboard.html'));
  } catch {
    return json(res, 500, { error: 'dashboard_unavailable' });
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res.end(html);
}

module.exports = {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  getRuntimeConfig,
  parseCookies,
  getEntitlement,
  trialIsActive,
  subscriptionIsActive,
  getAuthContext,
  handleAuthApi,
  handleProtectedAppRoute,
  signOut,
  redirect,
  json,
  safeNext
};
